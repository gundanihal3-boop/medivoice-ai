export interface Patient {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: string;
  mobile: string;
  registrationDate: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  qualification: string;
  availableDays: string[];
  workingStart: string;
  workingEnd: string;
  slotDurationMinutes: number;
  status: string;
}

export interface TimeSlot {
  doctorId: string;
  doctorName: string;
  departmentId: string;
  date: string;
  time: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  departmentId: string;
  doctorId: string;
  date: string;
  time: string;
  opdToken: number;
  bookingChannel: 'ai_voice' | 'reception' | 'admin';
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallMessage {
  speaker: 'ai' | 'patient' | 'system';
  text: string;
  timestamp: string;
}

export interface ExtractedIntent {
  reason_for_visit?: string;
  urgency?: 'routine' | 'potentially_urgent' | 'emergency';
  visit_type?: string;
  department?: string;
  preferred_date?: string | null;
  preferred_time?: string | null;
}

export interface CallSession {
  callId: string;
  patientId?: string;
  startTime: string;
  endTime?: string;
  reasonForCall?: string;
  reasonForVisit?: string;
  urgency?: 'routine' | 'potentially_urgent' | 'emergency';
  department?: string;
  selectedDoctor?: string;
  selectedSlot?: string;
  appointmentId?: string;
  bookingStatus?: 'initiated' | 'in_progress' | 'confirmed' | 'failed' | 'escalated' | 'cancelled';
  escalated: boolean;
  escalationReason?: string;
  transcript: CallMessage[];
  extractedIntent?: ExtractedIntent;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  callId?: string;
  patientId?: string;
  action: string;
  details?: Record<string, any>;
  channel: string;
}

export interface RoutingRule {
  id: string;
  symptomKeywords: string[];
  departmentId: string;
  urgencyDefault: 'routine' | 'potentially_urgent' | 'emergency';
  notes?: string;
}
