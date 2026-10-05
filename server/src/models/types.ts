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
  availableDays: string[]; // e.g. ["Monday", "Tuesday"]
  workingStart: string;    // "10:00"
  workingEnd: string;      // "16:00"
  slotDurationMinutes: number; // e.g. 30
  status: 'active' | 'inactive';
}

export interface TimeSlot {
  doctorId: string;
  doctorName: string;
  departmentId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  isAvailable: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  departmentId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
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
  patient_uhid?: string | null;
  patient_mobile?: string | null;
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
  action: 
    | 'CALL_STARTED'
    | 'PATIENT_IDENTIFIED'
    | 'INTENT_DETECTED'
    | 'DEPARTMENT_SELECTED'
    | 'AVAILABILITY_CHECKED'
    | 'SLOT_SELECTED'
    | 'APPOINTMENT_CREATED'
    | 'APPOINTMENT_CANCELLED'
    | 'APPOINTMENT_RESCHEDULED'
    | 'HUMAN_ESCALATION'
    | 'CALL_COMPLETED';
  details?: Record<string, any>;
  channel: 'ai_voice' | 'reception' | 'admin';
}

export interface RoutingRule {
  id: string;
  symptomKeywords: string[];
  departmentId: string;
  urgencyDefault: 'routine' | 'potentially_urgent' | 'emergency';
  notes?: string;
}

/**
  Abstract AppointmentService interface as required by Requirement #26
  Decouples the AI conversation layer from the underlying database/MedGuard API.
*/
export interface IAppointmentService {
  getAvailableSlots(departmentId?: string, doctorId?: string, date?: string): Promise<TimeSlot[]>;
  bookAppointment(params: {
    patientId: string;
    departmentId: string;
    doctorId: string;
    date: string;
    time: string;
    bookingChannel?: 'ai_voice' | 'reception' | 'admin';
    notes?: string;
  }): Promise<Appointment>;
  cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment>;
  rescheduleAppointment(appointmentId: string, newDate: string, newTime: string): Promise<Appointment>;
  getAppointmentById(appointmentId: string): Promise<Appointment | null>;
  getPatientAppointments(patientId: string): Promise<Appointment[]>;
}
