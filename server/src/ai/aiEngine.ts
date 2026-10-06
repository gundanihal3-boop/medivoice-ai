import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_TOOL_DEFINITIONS, executeToolCall } from './aiTools';
import { CallSessionService } from '../services/CallSessionService';
import { MasterDataService } from '../services/MasterDataService';
import { AuditService } from '../services/AuditService';
import { ExtractedIntent } from '../models/types';

const SYSTEM_PROMPT = `
You are MediVoice AI, an official AI Voice Appointment Assistant for Government Hospital.

CRITICAL MEDICAL SAFETY RULES:
1. You must NEVER provide a medical diagnosis. Never tell the patient what illness or condition they have.
2. If the patient mentions severe or life-threatening emergency symptoms (such as severe chest pain, extreme difficulty breathing, heavy uncontrolled bleeding, stroke signs, sudden loss of consciousness):
   - Immediately express concern: "Those symptoms may require urgent medical attention. Please follow the hospital's emergency procedure. I am escalating you to hospital staff immediately."
   - Call the tool: escalate_to_human({ reason: "Emergency medical symptoms reported" }).
3. Do NOT diagnose. Only categorize visits into:
   - "routine" (standard consultation/checkup/rashes/routine fever/tooth pain/eye check)
   - "potentially_urgent" (high fever, severe localized pain)
   - "emergency" (life-threatening symptoms)

CONVERSATION & WORKFLOW GUIDELINES:
- Be polite, concise, professional, empathetic, and clear. Speak like a helpful hospital desk staff.
- Step 1: Understand patient's problem/reason for visiting.
- Step 2: Determine if routine vs potentially urgent.
- Step 3: Map symptom to appropriate department (e.g., skin problem -> Dermatology, tooth pain -> Dental, eye issue -> Ophthalmology, fever/body ache -> General Medicine, child issues -> Pediatrics).
- Step 4: Ask if patient is already registered.
  - If YES: ask for registered mobile number or UHID, then call lookup_patient().
  - If NO: collect name, age, gender, and mobile number, then call create_patient().
- Step 5: Check doctor availability for the department/date using get_available_slots().
- Step 6: Present available times to patient.
- Step 7: When patient chooses a slot, call book_appointment().
- Step 8: Clearly announce confirmed appointment details & OPD Token number!

Always call the backend tools when needed. Never invent fake appointments without calling book_appointment().
`;

const EMERGENCY_KEYWORDS = [
  'chest pain', 'heart attack', 'cannot breathe', 'difficulty breathing',
  'heavy bleeding', 'severe bleeding', 'stroke', 'unconscious', 'fainted'
];

export class AIEngine {
  private static apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  static async processMessage(params: {
    callId: string;
    patientMessage: string;
  }): Promise<{ aiResponse: string; updatedSession: any }> {
    const { callId, patientMessage } = params;

    // 1. Add patient message to transcript
    CallSessionService.addTranscriptMessage(callId, 'patient', patientMessage);
    const session = CallSessionService.getSession(callId)!;

    // 2. Pre-screen for emergency keywords
    const lowerText = patientMessage.toLowerCase();
    const isEmergency = EMERGENCY_KEYWORDS.some(kw => lowerText.includes(kw));

    if (isEmergency) {
      const emergencyResponse = "Those symptoms may require urgent medical attention. Please follow the hospital's emergency procedure. I am connecting you with hospital emergency staff immediately.";
      
      await executeToolCall(callId, 'escalate_to_human', {
        reason: `Emergency symptoms detected in input: "${patientMessage}"`
      });

      CallSessionService.updateSession(callId, {
        urgency: 'emergency',
        escalated: true,
        escalationReason: 'Emergency symptoms reported by patient',
        bookingStatus: 'escalated'
      });

      CallSessionService.addTranscriptMessage(callId, 'ai', emergencyResponse);
      const updatedSession = CallSessionService.getSession(callId)!;
      return { aiResponse: emergencyResponse, updatedSession };
    }

    // 3. Extract Intent & Symptom Routing logic locally
    const routing = MasterDataService.findDepartmentBySymptom(patientMessage);
    const currentIntent: ExtractedIntent = session.extractedIntent || {};

    if (routing) {
      currentIntent.department = routing.department.name;
      currentIntent.urgency = routing.urgency;
      CallSessionService.updateSession(callId, {
        department: routing.department.name,
        urgency: routing.urgency,
        reasonForVisit: patientMessage
      });

      AuditService.logEvent({
        callId,
        action: 'INTENT_DETECTED',
        details: { department: routing.department.name, urgency: routing.urgency, reason: patientMessage }
      });

      AuditService.logEvent({
        callId,
        action: 'DEPARTMENT_SELECTED',
        details: { departmentId: routing.department.id, departmentName: routing.department.name }
      });
    }

    // 4. Handle LLM or Smart Fallback Engine
    let aiResponseText = '';
    
    if (this.apiKey) {
      try {
        aiResponseText = await this.callGeminiWithTools(callId, session, patientMessage);
      } catch (err: any) {
        console.warn('⚠️ Gemini API call failed or rate limited, falling back to rule engine:', err.message);
        aiResponseText = await this.fallbackRuleEngine(callId, session, patientMessage);
      }
    } else {
      console.log('ℹ️ No GEMINI_API_KEY found, using built-in intelligent rule engine');
      aiResponseText = await this.fallbackRuleEngine(callId, session, patientMessage);
    }

    // 5. Store AI Response in transcript & return
    CallSessionService.addTranscriptMessage(callId, 'ai', aiResponseText);
    const finalSession = CallSessionService.getSession(callId)!;

    return {
      aiResponse: aiResponseText,
      updatedSession: finalSession
    };
  }

  private static async callGeminiWithTools(callId: string, session: any, userPrompt: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT
    });

    const contents: any[] = session.transcript.map((m: any) => ({
      role: m.speaker === 'patient' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    const response = await model.generateContent({
      contents,
      tools: [{ functionDeclarations: AI_TOOL_DEFINITIONS as any }]
    });

    const candidate = response.response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter(p => p.functionCall);

    if (candidate && candidate.content && functionCalls && functionCalls.length > 0) {
      for (const part of functionCalls) {
        const fc = part.functionCall!;
        const toolResult = await executeToolCall(callId, fc.name, fc.args);
        
        // After executing tool, generate follow-up response
        const followUp = await model.generateContent({
          contents: [
            ...contents,
            candidate.content,
            {
              role: 'function',
              parts: [{
                functionResponse: {
                  name: fc.name,
                  response: toolResult
                }
              }]
            }
          ]
        });

        return followUp.response.text();
      }
    }

    return response.response.text() || "How else can I assist you with your hospital appointment today?";
  }

  private static async fallbackRuleEngine(callId: string, session: any, text: string): Promise<string> {
    const lower = text.toLowerCase();
    const history = session.transcript;

    // Check if patient provided UHID / Mobile
    const isUhid = text.match(/MG\d+|P\d+/i);
    const isMobile = text.match(/\b\d{10}\b/);

    if (isUhid || isMobile) {
      const query = isUhid ? isUhid[0].toUpperCase() : isMobile![0];
      const lookup = await executeToolCall(callId, 'lookup_patient', { query });
      if (lookup.success) {
        const patient = lookup.patient;
        
        // Next check department availability
        const routing = session.department || 'General Medicine';
        const depts = MasterDataService.getDepartments();
        const deptObj = depts.find(d => d.name.toLowerCase() === routing.toLowerCase()) || depts[0];

        const slotsResult = await executeToolCall(callId, 'get_available_slots', {
          departmentId: deptObj.id,
          date: 'tomorrow'
        });

        if (slotsResult.availableSlots && slotsResult.availableSlots.length > 0) {
          const firstSlot = slotsResult.availableSlots[0];
          return `Welcome back, ${patient.name}. I found your registration (${patient.uhid}). The next available ${deptObj.name} appointment with ${firstSlot.doctorName} is tomorrow at ${firstSlot.time}. Would you like me to book it?`;
        } else {
          return `Welcome back, ${patient.name}. I verified your registration (${patient.uhid}), but there are no open slots available tomorrow for ${deptObj.name}. Would you like me to check another date?`;
        }
      } else {
        return `I couldn't find a record matching ${query}. Let's register you as a new patient. Please tell me your full name, age, gender, and 10-digit mobile number.`;
      }
    }

    // Check if patient says "yes", "book it", "confirm" to book slot
    if (lower.includes('yes') || lower.includes('book') || lower.includes('confirm') || lower.includes('sure') || lower.includes('okay')) {
      if (session.patientId) {
        const routing = session.department || 'Dermatology';
        const depts = MasterDataService.getDepartments();
        const deptObj = depts.find(d => d.name.toLowerCase() === routing.toLowerCase()) || depts[0];
        const doctors = MasterDataService.getDoctors(deptObj.id);
        const doc = doctors[0];

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        const bookRes = await executeToolCall(callId, 'book_appointment', {
          patientId: session.patientId,
          departmentId: deptObj.id,
          doctorId: doc.id,
          date: tomorrowStr,
          time: '14:00'
        });

        if (bookRes.success) {
          return `Your appointment is confirmed for tomorrow at ${bookRes.time} with ${bookRes.doctorName}. Your OPD token is ${bookRes.opdToken}. A confirmation has been stored. Is there anything else I can help you with?`;
        } else {
          return `I apologize, but that slot is no longer available. Let me check another available slot for you.`;
        }
      }
    }

    // Initial greeting / symptom identification
    const routing = MasterDataService.findDepartmentBySymptom(text);
    if (routing) {
      return `I can help you book an appointment for ${routing.department.name}. Is this something that requires immediate medical attention, or would you like a routine consultation?`;
    }

    if (lower.includes('routine') || lower.includes('not urgent') || lower.includes('regular')) {
      return `Okay, routine consultation noted. Are you already registered with this hospital? If yes, please provide your registered mobile number or UHID.`;
    }

    if (lower.includes('no') && lower.includes('registered')) {
      return `No problem! I can register you right now. Please provide your full name, age, gender, and mobile number.`;
    }

    return `Hello, welcome to Government Hospital! I am MediVoice AI. How can I help you today? Please tell me your reason for visit.`;
  }
}
