import { db } from '../db/database';
import { CallMessage, CallSession, ExtractedIntent } from '../models/types';
import { AuditService } from './AuditService';

export class CallSessionService {
  static createSession(patientId?: string): CallSession {
    const callId = `CALL-${Math.floor(10000 + Math.random() * 90000)}`;
    const startTime = new Date().toISOString();
    const createdAt = startTime;

    const stmt = db.prepare(`
      INSERT INTO call_sessions (
        call_id, patient_id, start_time, booking_status, escalated, transcript, extracted_intent, created_at
      ) VALUES (?, ?, ?, 'initiated', 0, ?, ?, ?)
    `);

    stmt.run(callId, patientId || null, startTime, JSON.stringify([]), JSON.stringify({}), createdAt);

    AuditService.logEvent({
      callId,
      patientId,
      action: 'CALL_STARTED',
      details: { callId, startTime }
    });

    return {
      callId,
      patientId,
      startTime,
      bookingStatus: 'initiated',
      escalated: false,
      transcript: [],
      extractedIntent: {},
      createdAt
    };
  }

  static getSession(callId: string): CallSession | null {
    const stmt = db.prepare(`SELECT * FROM call_sessions WHERE call_id = ?`);
    const r = stmt.get(callId) as any;
    if (!r) return null;

    return {
      callId: r.call_id,
      patientId: r.patient_id,
      startTime: r.start_time,
      endTime: r.end_time,
      reasonForCall: r.reason_for_call,
      reasonForVisit: r.reason_for_visit,
      urgency: r.urgency,
      department: r.department,
      selectedDoctor: r.selected_doctor,
      selectedSlot: r.selected_slot,
      appointmentId: r.appointment_id,
      bookingStatus: r.booking_status,
      escalated: Boolean(r.escalated),
      escalationReason: r.escalation_reason,
      transcript: JSON.parse(r.transcript || '[]'),
      extractedIntent: JSON.parse(r.extracted_intent || '{}'),
      createdAt: r.created_at
    };
  }

  static updateSession(callId: string, updates: Partial<CallSession>): CallSession {
    const existing = this.getSession(callId);
    if (!existing) {
      throw new Error(`Call session ${callId} not found.`);
    }

    const merged = { ...existing, ...updates };

    const stmt = db.prepare(`
      UPDATE call_sessions
      SET patient_id = ?,
          end_time = ?,
          reason_for_call = ?,
          reason_for_visit = ?,
          urgency = ?,
          department = ?,
          selected_doctor = ?,
          selected_slot = ?,
          appointment_id = ?,
          booking_status = ?,
          escalated = ?,
          escalation_reason = ?,
          transcript = ?,
          extracted_intent = ?
      WHERE call_id = ?
    `);

    stmt.run(
      merged.patientId || null,
      merged.endTime || null,
      merged.reasonForCall || null,
      merged.reasonForVisit || null,
      merged.urgency || null,
      merged.department || null,
      merged.selectedDoctor || null,
      merged.selectedSlot || null,
      merged.appointmentId || null,
      merged.bookingStatus || null,
      merged.escalated ? 1 : 0,
      merged.escalationReason || null,
      JSON.stringify(merged.transcript || []),
      JSON.stringify(merged.extractedIntent || {}),
      callId
    );

    return merged;
  }

  static addTranscriptMessage(callId: string, speaker: 'ai' | 'patient' | 'system', text: string): CallSession {
    const session = this.getSession(callId);
    if (!session) throw new Error(`Call session ${callId} not found.`);

    const message: CallMessage = {
      speaker,
      text,
      timestamp: new Date().toISOString()
    };

    const newTranscript = [...session.transcript, message];
    return this.updateSession(callId, { transcript: newTranscript });
  }

  static getAllSessions(limit: number = 50): CallSession[] {
    const stmt = db.prepare(`SELECT * FROM call_sessions ORDER BY created_at DESC LIMIT ?`);
    const rows = stmt.all(limit) as any[];

    return rows.map(r => ({
      callId: r.call_id,
      patientId: r.patient_id,
      startTime: r.start_time,
      endTime: r.end_time,
      reasonForCall: r.reason_for_call,
      reasonForVisit: r.reason_for_visit,
      urgency: r.urgency,
      department: r.department,
      selectedDoctor: r.selected_doctor,
      selectedSlot: r.selected_slot,
      appointmentId: r.appointment_id,
      bookingStatus: r.booking_status,
      escalated: Boolean(r.escalated),
      escalationReason: r.escalation_reason,
      transcript: JSON.parse(r.transcript || '[]'),
      extractedIntent: JSON.parse(r.extracted_intent || '{}'),
      createdAt: r.created_at
    }));
  }
}
