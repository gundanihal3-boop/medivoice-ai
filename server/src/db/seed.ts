import { db, initDatabase } from './database';

export function seedDatabase() {
  console.log('🌱 Seeding MediVoice AI database...');
  initDatabase();

  // Clear existing tables cleanly
  db.exec(`
    DELETE FROM appointments;
    DELETE FROM call_sessions;
    DELETE FROM audit_events;
    DELETE FROM doctor_schedules;
    DELETE FROM doctors;
    DELETE FROM routing_rules;
    DELETE FROM departments;
    DELETE FROM patients;
    DELETE FROM hospital_settings;
  `);

  // 1. Departments (7 departments)
  const departments = [
    { id: 'GEN_MED', code: 'GEN', name: 'General Medicine', description: 'General health, fever, infections, routine health checks' },
    { id: 'DERM', code: 'DERM', name: 'Dermatology', description: 'Skin, hair, nail conditions and rash consultations' },
    { id: 'PED', code: 'PED', name: 'Pediatrics', description: 'Infant, child, and adolescent healthcare' },
    { id: 'ORTHO', code: 'ORTHO', name: 'Orthopedics', description: 'Bones, joints, spine, and musculoskeletal care' },
    { id: 'OPHTH', code: 'OPHTH', name: 'Ophthalmology', description: 'Eye exams, vision care, and eye disorders' },
    { id: 'ENT', code: 'ENT', name: 'Ear, Nose & Throat (ENT)', description: 'ENT conditions, sinus, hearing, and throat infections' },
    { id: 'DENT', code: 'DENT', name: 'Dental Care', description: 'Teeth, gums, oral health, and toothache relief' }
  ];

  const insertDept = db.prepare(`INSERT INTO departments (id, code, name, description, is_active) VALUES (?, ?, ?, ?, 1)`);
  for (const d of departments) {
    insertDept.run(d.id, d.code, d.name, d.description);
  }

  // 2. Doctors (10 doctors)
  const daysWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const doctors = [
    { id: 'DOC101', name: 'Dr. Priya Sharma', deptId: 'DERM', qual: 'MD (Dermatology)', days: daysWeek, start: '10:00', end: '16:00', dur: 30 },
    { id: 'DOC102', name: 'Dr. Ananya Roy', deptId: 'DERM', qual: 'DNB Dermatology', days: daysWeek, start: '11:00', end: '17:00', dur: 30 },
    { id: 'DOC103', name: 'Dr. Rajesh Kumar', deptId: 'GEN_MED', qual: 'MD (General Medicine)', days: daysWeek, start: '09:00', end: '15:00', dur: 20 },
    { id: 'DOC104', name: 'Dr. Vikram Sethi', deptId: 'GEN_MED', qual: 'MBBS, MD', days: daysWeek, start: '12:00', end: '18:00', dur: 20 },
    { id: 'DOC105', name: 'Dr. Sunita Patel', deptId: 'PED', qual: 'MD (Pediatrics)', days: daysWeek, start: '09:30', end: '14:30', dur: 30 },
    { id: 'DOC106', name: 'Dr. Ramesh Rao', deptId: 'ORTHO', qual: 'MS (Orthopedics)', days: daysWeek, start: '10:00', end: '16:00', dur: 30 },
    { id: 'DOC107', name: 'Dr. Meera Nair', deptId: 'OPHTH', qual: 'MS (Ophthalmology)', days: daysWeek, start: '10:00', end: '15:00', dur: 30 },
    { id: 'DOC108', name: 'Dr. Amit Gupta', deptId: 'ENT', qual: 'MS (ENT)', days: daysWeek, start: '11:00', end: '16:00', dur: 30 },
    { id: 'DOC109', name: 'Dr. Neha Verma', deptId: 'DENT', qual: 'BDS, MDS (Dental)', days: daysWeek, start: '09:00', end: '14:00', dur: 30 },
    { id: 'DOC110', name: 'Dr. Arjun Mehta', deptId: 'DENT', qual: 'MDS Oral Surgery', days: daysWeek, start: '14:00', end: '18:00', dur: 30 }
  ];

  const insertDoc = db.prepare(`
    INSERT INTO doctors (id, name, department_id, qualification, available_days, working_start, working_end, slot_duration_minutes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `);
  for (const doc of doctors) {
    insertDoc.run(doc.id, doc.name, doc.deptId, doc.qual, JSON.stringify(doc.days), doc.start, doc.end, doc.dur);
  }

  // 3. Patients (10 patients)
  const patients = [
    { id: 'P10283', uhid: 'MG10283', name: 'Rahul Kumar', age: 34, gender: 'Male', mobile: '9876543210' },
    { id: 'P10284', uhid: 'MG10284', name: 'Sneha Sharma', age: 28, gender: 'Female', mobile: '9876543211' },
    { id: 'P10285', uhid: 'MG10285', name: 'Amitabh Joshi', age: 52, gender: 'Male', mobile: '9876543212' },
    { id: 'P10286', uhid: 'MG10286', name: 'Pooja Reddy', age: 41, gender: 'Female', mobile: '9876543213' },
    { id: 'P10287', uhid: 'MG10287', name: 'Karan Malhotra', age: 24, gender: 'Male', mobile: '9876543214' },
    { id: 'P10288', uhid: 'MG10288', name: 'Divya Iyer', age: 31, gender: 'Female', mobile: '9876543215' },
    { id: 'P10289', uhid: 'MG10289', name: 'Sanjay Deshmukh', age: 60, gender: 'Male', mobile: '9876543216' },
    { id: 'P10290', uhid: 'MG10290', name: 'Ananya Das', age: 29, gender: 'Female', mobile: '9876543217' },
    { id: 'P10291', uhid: 'MG10291', name: 'Vikas Gupta', age: 45, gender: 'Male', mobile: '9876543218' },
    { id: 'P10292', uhid: 'MG10292', name: 'Ritu Kapoor', age: 37, gender: 'Female', mobile: '9876543219' }
  ];

  const insertPat = db.prepare(`
    INSERT INTO patients (id, uhid, name, age, gender, mobile, registration_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const todayDate = new Date().toISOString().split('T')[0];
  for (const p of patients) {
    insertPat.run(p.id, p.uhid, p.name, p.age, p.gender, p.mobile, todayDate);
  }

  // 4. Routing Rules
  const routingRules = [
    { id: 'RR-1', keywords: ['skin', 'rash', 'itching', 'acne', 'dermatology', 'skin rash'], deptId: 'DERM', urgency: 'routine' },
    { id: 'RR-2', keywords: ['tooth', 'teeth', 'dental', 'gum', 'toothache', 'cavity'], deptId: 'DENT', urgency: 'routine' },
    { id: 'RR-3', keywords: ['eye', 'vision', 'cataract', 'blur', 'ophthalmology'], deptId: 'OPHTH', urgency: 'routine' },
    { id: 'RR-4', keywords: ['fever', 'cold', 'cough', 'flu', 'general checkup', 'body pain', 'weakness'], deptId: 'GEN_MED', urgency: 'routine' },
    { id: 'RR-5', keywords: ['child', 'kid', 'pediatric', 'baby', 'infant'], deptId: 'PED', urgency: 'routine' },
    { id: 'RR-6', keywords: ['bone', 'joint', 'fracture', 'knee', 'back pain', 'ortho'], deptId: 'ORTHO', urgency: 'routine' },
    { id: 'RR-7', keywords: ['ear', 'nose', 'throat', 'sinus', 'ent'], deptId: 'ENT', urgency: 'routine' }
  ];

  const insertRule = db.prepare(`
    INSERT INTO routing_rules (id, symptom_keywords, department_id, urgency_default, notes)
    VALUES (?, ?, ?, ?, 'Seeded routing rule')
  `);
  for (const r of routingRules) {
    insertRule.run(r.id, JSON.stringify(r.keywords), r.deptId, r.urgency);
  }

  // 5. Hospital Settings
  const settings = [
    { key: 'hospital_name', value: 'Government General Hospital', description: 'Main hospital title' },
    { key: 'emergency_phone', value: '+91-1800-112-911', description: 'Emergency hotline' },
    { key: 'operating_hours', value: '08:00 - 20:00 IST', description: 'Hospital OPD hours' },
    { key: 'emergency_protocol', value: 'Immediately route to hospital emergency room desk or dispatch ambulance.', description: 'Emergency escalation protocol' }
  ];

  const insertSetting = db.prepare(`INSERT INTO hospital_settings (key, value, description) VALUES (?, ?, ?)`);
  for (const s of settings) {
    insertSetting.run(s.key, s.value, s.description);
  }

  // 6. Sample Call Sessions & Appointments
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const insertApt = db.prepare(`
    INSERT INTO appointments (id, patient_id, department_id, doctor_id, date, time, opd_token, booking_channel, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
  `);

  insertApt.run('APT-20394', 'P10283', 'DERM', 'DOC101', tomorrowStr, '14:00', 47, 'ai_voice', 'Skin rash consultation', todayDate, todayDate);
  insertApt.run('APT-20395', 'P10284', 'DENT', 'DOC109', tomorrowStr, '10:00', 12, 'ai_voice', 'Toothache checkup', todayDate, todayDate);
  insertApt.run('APT-20396', 'P10285', 'GEN_MED', 'DOC103', tomorrowStr, '11:00', 18, 'reception', 'Routine BP & fever checkup', todayDate, todayDate);

  const insertCall = db.prepare(`
    INSERT INTO call_sessions (call_id, patient_id, start_time, end_time, reason_for_call, reason_for_visit, urgency, department, selected_doctor, selected_slot, appointment_id, booking_status, escalated, transcript, extracted_intent, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCall.run(
    'CALL-10029',
    'P10283',
    new Date(Date.now() - 300000).toISOString(),
    new Date().toISOString(),
    'Appointment Booking',
    'Skin rash consultation',
    'routine',
    'Dermatology',
    'Dr. Priya Sharma',
    `${tomorrowStr} 14:00`,
    'APT-20394',
    'confirmed',
    0,
    JSON.stringify([
      { speaker: 'ai', text: 'Hello, welcome to Government Hospital. How can I help you today?', timestamp: new Date().toISOString() },
      { speaker: 'patient', text: 'I want to see a skin doctor. I have rashes on my hands.', timestamp: new Date().toISOString() },
      { speaker: 'ai', text: 'I can help you book a dermatology appointment. Is this urgent or routine?', timestamp: new Date().toISOString() },
      { speaker: 'patient', text: 'It is routine. My UHID is MG10283.', timestamp: new Date().toISOString() },
      { speaker: 'ai', text: 'Welcome back Rahul. The next available dermatology appointment with Dr. Priya Sharma is tomorrow at 2:00 PM. Would you like me to book it?', timestamp: new Date().toISOString() },
      { speaker: 'patient', text: 'Yes, please book it.', timestamp: new Date().toISOString() },
      { speaker: 'ai', text: 'Your appointment is confirmed for tomorrow at 2:00 PM. Your OPD token is 47.', timestamp: new Date().toISOString() }
    ]),
    JSON.stringify({ reason_for_visit: 'skin rash', urgency: 'routine', department: 'Dermatology' }),
    todayDate
  );

  // 7. Audit Events
  const insertAudit = db.prepare(`
    INSERT INTO audit_events (id, timestamp, call_id, patient_id, action, details, channel)
    VALUES (?, ?, ?, ?, ?, ?, 'ai_voice')
  `);

  insertAudit.run('AUD-1001', new Date().toISOString(), 'CALL-10029', 'P10283', 'CALL_STARTED', JSON.stringify({ channel: 'ai_voice' }));
  insertAudit.run('AUD-1002', new Date().toISOString(), 'CALL-10029', 'P10283', 'PATIENT_IDENTIFIED', JSON.stringify({ uhid: 'MG10283', name: 'Rahul Kumar' }));
  insertAudit.run('AUD-1003', new Date().toISOString(), 'CALL-10029', 'P10283', 'DEPARTMENT_SELECTED', JSON.stringify({ department: 'Dermatology' }));
  insertAudit.run('AUD-1004', new Date().toISOString(), 'CALL-10029', 'P10283', 'APPOINTMENT_CREATED', JSON.stringify({ appointmentId: 'APT-20394', opdToken: 47 }));

  console.log('✅ Database seeded successfully with 10 Patients, 7 Departments, 10 Doctors, Rules, and Sample Data.');
}

if (require.main === module) {
  seedDatabase();
}
