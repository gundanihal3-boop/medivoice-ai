import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../medivoice.db');

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Enable WAL mode for better concurrency and performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      uhid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      mobile TEXT UNIQUE NOT NULL,
      registration_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department_id TEXT NOT NULL,
      qualification TEXT NOT NULL,
      available_days TEXT NOT NULL, -- JSON array of strings e.g. ["Monday", "Tuesday"]
      working_start TEXT NOT NULL,  -- e.g. "10:00"
      working_end TEXT NOT NULL,    -- e.g. "16:00"
      slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id TEXT PRIMARY KEY,
      doctor_id TEXT NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      is_available INTEGER DEFAULT 1,
      start_time TEXT,
      end_time TEXT,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      date TEXT NOT NULL, -- YYYY-MM-DD
      time TEXT NOT NULL, -- HH:MM
      opd_token INTEGER NOT NULL,
      booking_channel TEXT NOT NULL DEFAULT 'ai_voice', -- 'ai_voice', 'reception', 'admin'
      status TEXT NOT NULL DEFAULT 'confirmed', -- 'confirmed', 'cancelled', 'rescheduled', 'completed'
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    -- Strict Unique Index to prevent double booking active/confirmed slots for a doctor on a given date and time
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
    ON appointments (doctor_id, date, time) 
    WHERE status = 'confirmed';

    CREATE TABLE IF NOT EXISTS call_sessions (
      call_id TEXT PRIMARY KEY,
      patient_id TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      reason_for_call TEXT,
      reason_for_visit TEXT,
      urgency TEXT, -- 'routine', 'potentially_urgent', 'emergency'
      department TEXT,
      selected_doctor TEXT,
      selected_slot TEXT,
      appointment_id TEXT,
      booking_status TEXT, -- 'initiated', 'in_progress', 'confirmed', 'failed', 'escalated', 'cancelled'
      escalated INTEGER DEFAULT 0,
      escalation_reason TEXT,
      transcript TEXT, -- JSON array of messages
      extracted_intent TEXT, -- JSON object
      created_at TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      call_id TEXT,
      patient_id TEXT,
      action TEXT NOT NULL,
      details TEXT, -- JSON string
      channel TEXT DEFAULT 'ai_voice'
    );

    CREATE TABLE IF NOT EXISTS routing_rules (
      id TEXT PRIMARY KEY,
      symptom_keywords TEXT NOT NULL, -- JSON array of string keywords
      department_id TEXT NOT NULL,
      urgency_default TEXT DEFAULT 'routine',
      notes TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS hospital_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT
    );
  `);

  console.log('✅ SQLite database schema initialized successfully.');
}
