import { db } from '../db/database';
import { Appointment, IAppointmentService, TimeSlot } from '../models/types';
import { MasterDataService } from './MasterDataService';
import { AuditService } from './AuditService';

export class StandaloneAppointmentService implements IAppointmentService {
  async getAvailableSlots(departmentId?: string, doctorId?: string, targetDate?: string): Promise<TimeSlot[]> {
    const todayStr = targetDate || new Date().toISOString().split('T')[0];
    const targetDayName = new Date(todayStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });

    let doctors = MasterDataService.getDoctors(departmentId);
    if (doctorId) {
      doctors = doctors.filter(d => d.id === doctorId);
    }

    const availableSlots: TimeSlot[] = [];

    for (const doctor of doctors) {
      // Check if doctor works on this weekday
      if (!doctor.availableDays.map(d => d.toLowerCase()).includes(targetDayName.toLowerCase())) {
        continue;
      }

      // Generate time slots between workingStart and workingEnd
      const slots = this.generateTimeSlots(doctor.workingStart, doctor.workingEnd, doctor.slotDurationMinutes);

      // Query database for already confirmed appointments for this doctor on targetDate
      const stmt = db.prepare(`
        SELECT time FROM appointments
        WHERE doctor_id = ? AND date = ? AND status = 'confirmed'
      `);
      const bookedRows = stmt.all(doctor.id, todayStr) as { time: string }[];
      const bookedTimes = new Set(bookedRows.map(r => r.time));

      for (const slotTime of slots) {
        availableSlots.push({
          doctorId: doctor.id,
          doctorName: doctor.name,
          departmentId: doctor.departmentId,
          date: todayStr,
          time: slotTime,
          isAvailable: !bookedTimes.has(slotTime)
        });
      }
    }

    return availableSlots;
  }

  async bookAppointment(params: {
    patientId: string;
    departmentId: string;
    doctorId: string;
    date: string;
    time: string;
    bookingChannel?: 'ai_voice' | 'reception' | 'admin';
    notes?: string;
    callId?: string;
  }): Promise<Appointment> {
    const channel = params.bookingChannel || 'ai_voice';

    // Atomic transaction execution for double booking prevention
    const bookTx = db.transaction(() => {
      // Check for existing confirmed booking for this doctor, date, and time
      const checkStmt = db.prepare(`
        SELECT id FROM appointments
        WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'confirmed'
      `);
      const existing = checkStmt.get(params.doctorId, params.date, params.time);

      if (existing) {
        throw new Error(`SLOT_UNAVAILABLE: Time slot ${params.time} on ${params.date} for doctor ${params.doctorId} is already booked.`);
      }

      // Get highest OPD token for doctor on this date
      const tokenStmt = db.prepare(`
        SELECT COALESCE(MAX(opd_token), 0) as maxToken
        WHERE 1=1
      `);
      const maxTokenRow = db.prepare(`
        SELECT COALESCE(MAX(opd_token), 0) as maxToken
        FROM appointments
        WHERE doctor_id = ? AND date = ?
      `).get(params.doctorId, params.date) as { maxToken: number };

      const opdToken = (maxTokenRow?.maxToken || 0) + 1;
      const id = `APT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();

      const insertStmt = db.prepare(`
        INSERT INTO appointments (
          id, patient_id, department_id, doctor_id, date, time, opd_token, booking_channel, status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
      `);

      insertStmt.run(
        id,
        params.patientId,
        params.departmentId,
        params.doctorId,
        params.date,
        params.time,
        opdToken,
        channel,
        params.notes || null,
        now,
        now
      );

      AuditService.logEvent({
        callId: params.callId,
        patientId: params.patientId,
        action: 'APPOINTMENT_CREATED',
        details: {
          appointmentId: id,
          doctorId: params.doctorId,
          date: params.date,
          time: params.time,
          opdToken,
          bookingChannel: channel
        },
        channel
      });

      return {
        id,
        patientId: params.patientId,
        departmentId: params.departmentId,
        doctorId: params.doctorId,
        date: params.date,
        time: params.time,
        opdToken,
        bookingChannel: channel,
        status: 'confirmed' as const,
        notes: params.notes,
        createdAt: now,
        updatedAt: now
      };
    });

    return bookTx();
  }

  async cancelAppointment(appointmentId: string, reason?: string, callId?: string): Promise<Appointment> {
    const cancelTx = db.transaction((): Appointment => {
      const apt = this.getAppointmentByIdSync(appointmentId);
      if (!apt) {
        throw new Error(`APPOINTMENT_NOT_FOUND: Appointment ${appointmentId} does not exist.`);
      }

      if (apt.status === 'cancelled') {
        return apt;
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE appointments
        SET status = 'cancelled', notes = COALESCE(notes, '') || ?, updated_at = ?
        WHERE id = ?
      `);

      stmt.run(reason ? ` [Cancelled: ${reason}]` : ' [Cancelled]', now, appointmentId);

      AuditService.logEvent({
        callId,
        patientId: apt.patientId,
        action: 'APPOINTMENT_CANCELLED',
        details: { appointmentId, reason }
      });

      return {
        ...apt,
        status: 'cancelled' as const,
        notes: (apt.notes || '') + (reason ? ` [Cancelled: ${reason}]` : ' [Cancelled]'),
        updatedAt: now
      };
    });

    return cancelTx();
  }

  async rescheduleAppointment(appointmentId: string, newDate: string, newTime: string, callId?: string): Promise<Appointment> {
    const rescheduleTx = db.transaction((): Appointment => {
      const apt = this.getAppointmentByIdSync(appointmentId);
      if (!apt) {
        throw new Error(`APPOINTMENT_NOT_FOUND: Appointment ${appointmentId} does not exist.`);
      }

      // Check if new slot is available
      const checkStmt = db.prepare(`
        SELECT id FROM appointments
        WHERE doctor_id = ? AND date = ? AND time = ? AND status = 'confirmed' AND id != ?
      `);
      const conflict = checkStmt.get(apt.doctorId, newDate, newTime, appointmentId);

      if (conflict) {
        throw new Error(`SLOT_UNAVAILABLE: Time slot ${newTime} on ${newDate} is already booked.`);
      }

      const now = new Date().toISOString();
      const stmt = db.prepare(`
        UPDATE appointments
        SET date = ?, time = ?, status = 'confirmed', updated_at = ?
        WHERE id = ?
      `);

      stmt.run(newDate, newTime, now, appointmentId);

      AuditService.logEvent({
        callId,
        patientId: apt.patientId,
        action: 'APPOINTMENT_RESCHEDULED',
        details: { appointmentId, oldDate: apt.date, oldTime: apt.time, newDate, newTime }
      });

      return {
        ...apt,
        date: newDate,
        time: newTime,
        status: 'confirmed' as const,
        updatedAt: now
      };
    });

    return rescheduleTx();
  }

  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return this.getAppointmentByIdSync(appointmentId);
  }

  private getAppointmentByIdSync(appointmentId: string): Appointment | null {
    const stmt = db.prepare(`SELECT * FROM appointments WHERE id = ?`);
    const r = stmt.get(appointmentId) as any;
    if (!r) return null;

    return {
      id: r.id,
      patientId: r.patient_id,
      departmentId: r.department_id,
      doctorId: r.doctor_id,
      date: r.date,
      time: r.time,
      opdToken: r.opd_token,
      bookingChannel: r.booking_channel,
      status: r.status as Appointment['status'],
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    };
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const stmt = db.prepare(`SELECT * FROM appointments WHERE patient_id = ? ORDER BY date DESC, time DESC`);
    const rows = stmt.all(patientId) as any[];

    return rows.map(r => ({
      id: r.id,
      patientId: r.patient_id,
      departmentId: r.department_id,
      doctorId: r.doctor_id,
      date: r.date,
      time: r.time,
      opdToken: r.opd_token,
      bookingChannel: r.booking_channel,
      status: r.status as Appointment['status'],
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const stmt = db.prepare(`SELECT * FROM appointments ORDER BY created_at DESC`);
    const rows = stmt.all() as any[];

    return rows.map(r => ({
      id: r.id,
      patientId: r.patient_id,
      departmentId: r.department_id,
      doctorId: r.doctor_id,
      date: r.date,
      time: r.time,
      opdToken: r.opd_token,
      bookingChannel: r.booking_channel,
      status: r.status as Appointment['status'],
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  private generateTimeSlots(start: string, end: string, durationMin: number): string[] {
    const result: string[] = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    let currentMinutes = h * 60 + m;
    const endMinutes = endH * 60 + endM;

    while (currentMinutes + durationMin <= endMinutes) {
      const slotH = Math.floor(currentMinutes / 60);
      const slotM = currentMinutes % 60;
      const formatted = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}`;
      result.push(formatted);
      currentMinutes += durationMin;
    }

    return result;
  }
}

// Export singleton instance conforming to abstract IAppointmentService interface
export const defaultAppointmentService = new StandaloneAppointmentService();
