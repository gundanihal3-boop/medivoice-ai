import { PatientService } from '../services/PatientService';
import { MasterDataService } from '../services/MasterDataService';
import { defaultAppointmentService } from '../services/AppointmentService';
import { CallSessionService } from '../services/CallSessionService';
import { AuditService } from '../services/AuditService';

export interface ToolCallResult {
  tool: string;
  result: any;
}

export const AI_TOOL_DEFINITIONS = [
  {
    name: 'lookup_patient',
    description: 'Look up an existing registered patient by UHID, Mobile number, or Patient ID.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Patient UHID, mobile number, or ID' }
      },
      required: ['query']
    }
  },
  {
    name: 'create_patient',
    description: 'Register a new patient with minimal details: name, age, gender, and mobile number.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Patient full name' },
        age: { type: 'number', description: 'Patient age in years' },
        gender: { type: 'string', description: 'Patient gender (Male, Female, Other)' },
        mobile: { type: 'string', description: 'Patient 10-digit mobile number' }
      },
      required: ['name', 'age', 'gender', 'mobile']
    }
  },
  {
    name: 'get_departments',
    description: 'Get list of available hospital departments.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_doctors',
    description: 'Get list of active doctors, optionally filtered by department ID.',
    parameters: {
      type: 'object',
      properties: {
        departmentId: { type: 'string', description: 'Optional department ID (e.g. DERM, DENT)' }
      }
    }
  },
  {
    name: 'get_available_slots',
    description: 'Check available consultation slots for a department or doctor on a target date.',
    parameters: {
      type: 'object',
      properties: {
        departmentId: { type: 'string', description: 'Department ID' },
        doctorId: { type: 'string', description: 'Doctor ID' },
        date: { type: 'string', description: 'Target date in YYYY-MM-DD format (defaults to today/tomorrow)' }
      }
    }
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment slot for a verified patient.',
    parameters: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID (e.g. P10283)' },
        departmentId: { type: 'string', description: 'Department ID' },
        doctorId: { type: 'string', description: 'Doctor ID' },
        date: { type: 'string', description: 'Date YYYY-MM-DD' },
        time: { type: 'string', description: 'Time HH:MM (e.g. 14:00)' }
      },
      required: ['patientId', 'departmentId', 'doctorId', 'date', 'time']
    }
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing confirmed appointment.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', description: 'Appointment ID (e.g. APT-20394)' },
        reason: { type: 'string', description: 'Reason for cancellation' }
      },
      required: ['appointmentId']
    }
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing confirmed appointment to a new date and time.',
    parameters: {
      type: 'object',
      properties: {
        appointmentId: { type: 'string', description: 'Appointment ID' },
        newDate: { type: 'string', description: 'New date YYYY-MM-DD' },
        newTime: { type: 'string', description: 'New time HH:MM' }
      },
      required: ['appointmentId', 'newDate', 'newTime']
    }
  },
  {
    name: 'get_patient_appointments',
    description: 'Get all appointments for a patient.',
    parameters: {
      type: 'object',
      properties: {
        patientId: { type: 'string', description: 'Patient ID' }
      },
      required: ['patientId']
    }
  },
  {
    name: 'escalate_to_human',
    description: 'Escalate the call to a human receptionist/hospital emergency desk.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Reason for human escalation' }
      },
      required: ['reason']
    }
  }
];

export async function executeToolCall(callId: string, toolName: string, args: any): Promise<any> {
  console.log(`🤖 AI Tool Call [${callId}]: ${toolName}`, args);

  switch (toolName) {
    case 'lookup_patient': {
      const patient = PatientService.findByIdOrUhidOrMobile(args.query);
      if (patient) {
        CallSessionService.updateSession(callId, { patientId: patient.id });
        AuditService.logEvent({
          callId,
          patientId: patient.id,
          action: 'PATIENT_IDENTIFIED',
          details: { query: args.query, patient }
        });
        return { success: true, patient };
      }
      return { success: false, message: `No patient found matching ${args.query}. Ask if they are a new patient.` };
    }

    case 'create_patient': {
      const patient = PatientService.createPatient({
        name: args.name,
        age: Number(args.age),
        gender: args.gender,
        mobile: args.mobile,
        callId
      });
      CallSessionService.updateSession(callId, { patientId: patient.id });
      return { success: true, patient };
    }

    case 'get_departments': {
      const departments = MasterDataService.getDepartments();
      return { success: true, departments };
    }

    case 'get_doctors': {
      const doctors = MasterDataService.getDoctors(args.departmentId);
      return { success: true, doctors };
    }

    case 'get_available_slots': {
      let targetDate = args.date;
      if (!targetDate || targetDate === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
      } else if (targetDate === 'today') {
        targetDate = new Date().toISOString().split('T')[0];
      }

      const slots = await defaultAppointmentService.getAvailableSlots(args.departmentId, args.doctorId, targetDate);
      const openSlots = slots.filter(s => s.isAvailable);

      AuditService.logEvent({
        callId,
        action: 'AVAILABILITY_CHECKED',
        details: { departmentId: args.departmentId, doctorId: args.doctorId, date: targetDate, openSlotsCount: openSlots.length }
      });

      return {
        success: true,
        date: targetDate,
        totalAvailableSlots: openSlots.length,
        availableSlots: openSlots
      };
    }

    case 'book_appointment': {
      try {
        const appointment = await defaultAppointmentService.bookAppointment({
          patientId: args.patientId,
          departmentId: args.departmentId,
          doctorId: args.doctorId,
          date: args.date,
          time: args.time,
          bookingChannel: 'ai_voice',
          callId
        });

        const doc = MasterDataService.getDoctorById(args.doctorId);

        CallSessionService.updateSession(callId, {
          appointmentId: appointment.id,
          selectedDoctor: doc ? doc.name : args.doctorId,
          selectedSlot: `${args.date} ${args.time}`,
          bookingStatus: 'confirmed'
        });

        return {
          success: true,
          appointmentId: appointment.id,
          opdToken: appointment.opdToken,
          doctorName: doc ? doc.name : args.doctorId,
          date: appointment.date,
          time: appointment.time,
          message: `Appointment confirmed! OPD Token: ${appointment.opdToken}`
        };
      } catch (err: any) {
        return {
          success: false,
          error: err.message,
          message: 'The requested slot is no longer available. Please choose another time slot.'
        };
      }
    }

    case 'cancel_appointment': {
      try {
        const apt = await defaultAppointmentService.cancelAppointment(args.appointmentId, args.reason, callId);
        CallSessionService.updateSession(callId, { bookingStatus: 'cancelled' });
        return { success: true, appointment: apt, message: `Appointment ${args.appointmentId} has been cancelled.` };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    case 'reschedule_appointment': {
      try {
        const apt = await defaultAppointmentService.rescheduleAppointment(args.appointmentId, args.newDate, args.newTime, callId);
        CallSessionService.updateSession(callId, {
          selectedSlot: `${args.newDate} ${args.newTime}`,
          bookingStatus: 'confirmed'
        });
        return {
          success: true,
          appointment: apt,
          message: `Appointment rescheduled to ${args.newDate} at ${args.newTime}. OPD Token remains ${apt.opdToken}.`
        };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    case 'get_patient_appointments': {
      const appointments = await defaultAppointmentService.getPatientAppointments(args.patientId);
      return { success: true, appointments };
    }

    case 'escalate_to_human': {
      CallSessionService.updateSession(callId, {
        escalated: true,
        escalationReason: args.reason,
        bookingStatus: 'escalated'
      });
      AuditService.logEvent({
        callId,
        action: 'HUMAN_ESCALATION',
        details: { reason: args.reason }
      });
      return {
        success: true,
        escalated: true,
        message: 'Connecting to hospital desk staff...'
      };
    }

    default:
      return { success: false, error: `Unknown tool ${toolName}` };
  }
}
