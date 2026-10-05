import { Router, Request, Response } from 'express';
import { PatientService } from '../services/PatientService';
import { MasterDataService } from '../services/MasterDataService';
import { defaultAppointmentService } from '../services/AppointmentService';
import { CallSessionService } from '../services/CallSessionService';
import { AuditService } from '../services/AuditService';
import { AIEngine } from '../ai/aiEngine';
import { seedDatabase } from '../db/seed';

const router = Router();

// --- PATIENTS ---
router.get('/patients', (req: Request, res: Response) => {
  try {
    const patients = PatientService.getAllPatients();
    res.json({ success: true, count: patients.length, patients });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/patients/:query', (req: Request, res: Response) => {
  try {
    const patient = PatientService.findByIdOrUhidOrMobile(req.params.query);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/patients', (req: Request, res: Response) => {
  try {
    const { name, age, gender, mobile } = req.body;
    if (!name || !age || !gender || !mobile) {
      return res.status(400).json({ success: false, message: 'Missing required fields: name, age, gender, mobile' });
    }
    const patient = PatientService.createPatient({ name, age: Number(age), gender, mobile });
    res.status(201).json({ success: true, patient });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- DEPARTMENTS & DOCTORS ---
router.get('/departments', (req: Request, res: Response) => {
  try {
    const departments = MasterDataService.getDepartments();
    res.json({ success: true, count: departments.length, departments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/doctors', (req: Request, res: Response) => {
  try {
    const { departmentId } = req.query;
    const doctors = MasterDataService.getDoctors(departmentId as string);
    res.json({ success: true, count: doctors.length, doctors });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- APPOINTMENTS ---
router.get('/appointments/available-slots', async (req: Request, res: Response) => {
  try {
    const { departmentId, doctorId, date } = req.query;
    const slots = await defaultAppointmentService.getAvailableSlots(
      departmentId as string,
      doctorId as string,
      date as string
    );
    res.json({ success: true, count: slots.length, availableSlots: slots });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/appointments', async (req: Request, res: Response) => {
  try {
    const appointments = await defaultAppointmentService.getAllAppointments();
    res.json({ success: true, count: appointments.length, appointments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const apt = await defaultAppointmentService.getAppointmentById(req.params.id);
    if (!apt) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, appointment: apt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/appointments', async (req: Request, res: Response) => {
  try {
    const { patientId, departmentId, doctorId, date, time, bookingChannel, notes } = req.body;
    const appointment = await defaultAppointmentService.bookAppointment({
      patientId,
      departmentId,
      doctorId,
      date,
      time,
      bookingChannel: bookingChannel || 'admin',
      notes
    });
    res.status(201).json({ success: true, appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/appointments/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const appointment = await defaultAppointmentService.cancelAppointment(req.params.id, reason);
    res.json({ success: true, appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.patch('/appointments/:id', async (req: Request, res: Response) => {
  try {
    const { date, time } = req.body;
    const appointment = await defaultAppointmentService.rescheduleAppointment(req.params.id, date, time);
    res.json({ success: true, appointment });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- CALL SESSIONS & AI SIMULATION ---
router.post('/calls', (req: Request, res: Response) => {
  try {
    const { patientId } = req.body;
    const session = CallSessionService.createSession(patientId);
    
    // Auto add initial greeting
    const greeting = "Hello, welcome to Government Hospital! How can I help you today?";
    CallSessionService.addTranscriptMessage(session.callId, 'ai', greeting);
    const updated = CallSessionService.getSession(session.callId);

    res.status(201).json({ success: true, session: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/calls', (req: Request, res: Response) => {
  try {
    const sessions = CallSessionService.getAllSessions();
    res.json({ success: true, count: sessions.length, calls: sessions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/calls/:id', (req: Request, res: Response) => {
  try {
    const session = CallSessionService.getSession(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Call session not found' });
    }
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/calls/:id/interact', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const { aiResponse, updatedSession } = await AIEngine.processMessage({
      callId: req.params.id,
      patientMessage: message
    });

    res.json({
      success: true,
      aiResponse,
      session: updatedSession
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- AUDIT EVENTS ---
router.get('/audit', (req: Request, res: Response) => {
  try {
    const events = AuditService.getAuditEvents(100);
    res.json({ success: true, count: events.length, auditEvents: events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- HOSPITAL SETTINGS & DEMO SEED ---
router.get('/admin/settings', (req: Request, res: Response) => {
  try {
    const settings = MasterDataService.getHospitalSettings();
    const routingRules = MasterDataService.getRoutingRules();
    res.json({ success: true, settings, routingRules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/demo/seed', (req: Request, res: Response) => {
  try {
    seedDatabase();
    res.json({ success: true, message: 'Demo database seeded successfully with departments, doctors, patients, calls, and appointments!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
