import { Appointment, AuditEvent, CallSession, Department, Doctor, Patient, RoutingRule, TimeSlot } from './types';

const API_BASE = '/api';

export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch(`${API_BASE}/departments`);
  const data = await res.json();
  return data.departments || [];
}

export async function fetchDoctors(departmentId?: string): Promise<Doctor[]> {
  const url = departmentId ? `${API_BASE}/doctors?departmentId=${departmentId}` : `${API_BASE}/doctors`;
  const res = await fetch(url);
  const data = await res.json();
  return data.doctors || [];
}

export async function fetchAvailableSlots(departmentId?: string, doctorId?: string, date?: string): Promise<TimeSlot[]> {
  const params = new URLSearchParams();
  if (departmentId) params.append('departmentId', departmentId);
  if (doctorId) params.append('doctorId', doctorId);
  if (date) params.append('date', date);

  const res = await fetch(`${API_BASE}/appointments/available-slots?${params.toString()}`);
  const data = await res.json();
  return data.availableSlots || [];
}

export async function fetchAppointments(): Promise<Appointment[]> {
  const res = await fetch(`${API_BASE}/appointments`);
  const data = await res.json();
  return data.appointments || [];
}

export async function bookAppointment(params: {
  patientId: string;
  departmentId: string;
  doctorId: string;
  date: string;
  time: string;
  bookingChannel?: 'ai_voice' | 'reception' | 'admin';
  notes?: string;
}): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to book appointment');
  }
  return data.appointment;
}

export async function cancelAppointment(appointmentId: string, reason?: string): Promise<Appointment> {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to cancel appointment');
  }
  return data.appointment;
}

export async function fetchPatients(): Promise<Patient[]> {
  const res = await fetch(`${API_BASE}/patients`);
  const data = await res.json();
  return data.patients || [];
}

export async function startCallSession(patientId?: string): Promise<CallSession> {
  const res = await fetch(`${API_BASE}/calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId })
  });
  const data = await res.json();
  return data.session;
}

export async function fetchCalls(): Promise<CallSession[]> {
  const res = await fetch(`${API_BASE}/calls`);
  const data = await res.json();
  return data.calls || [];
}

export async function interactWithCall(callId: string, message: string): Promise<{ aiResponse: string; session: CallSession }> {
  const res = await fetch(`${API_BASE}/calls/${callId}/interact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to communicate with AI server');
  }
  return { aiResponse: data.aiResponse, session: data.session };
}

export async function fetchAuditLogs(): Promise<AuditEvent[]> {
  const res = await fetch(`${API_BASE}/audit`);
  const data = await res.json();
  return data.auditEvents || [];
}

export async function seedDemoData(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/seed`, { method: 'POST' });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to seed data');
}

export async function fetchAdminSettings(): Promise<{ settings: Record<string, string>; routingRules: RoutingRule[] }> {
  const res = await fetch(`${API_BASE}/admin/settings`);
  const data = await res.json();
  return { settings: data.settings || {}, routingRules: data.routingRules || [] };
}
