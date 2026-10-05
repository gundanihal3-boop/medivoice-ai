import { db } from '../db/database';
import { Patient } from '../models/types';
import { AuditService } from './AuditService';

export class PatientService {
  static findByIdOrUhidOrMobile(query: string): Patient | null {
    const cleanQuery = query.trim();
    const stmt = db.prepare(`
      SELECT * FROM patients 
      WHERE id = ? OR uhid = ? OR mobile = ?
    `);
    const row = stmt.get(cleanQuery, cleanQuery, cleanQuery) as any;
    if (!row) return null;

    return {
      id: row.id,
      uhid: row.uhid,
      name: row.name,
      age: row.age,
      gender: row.gender,
      mobile: row.mobile,
      registrationDate: row.registration_date
    };
  }

  static createPatient(params: {
    name: string;
    age: number;
    gender: string;
    mobile: string;
    callId?: string;
  }): Patient {
    const existing = this.findByIdOrUhidOrMobile(params.mobile);
    if (existing) {
      return existing;
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const id = `P${randomNum}`;
    const uhid = `MG${randomNum}`;
    const registrationDate = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO patients (id, uhid, name, age, gender, mobile, registration_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, uhid, params.name, params.age, params.gender, params.mobile, registrationDate);

    AuditService.logEvent({
      callId: params.callId,
      patientId: id,
      action: 'PATIENT_IDENTIFIED',
      details: { isNew: true, uhid, name: params.name }
    });

    return {
      id,
      uhid,
      name: params.name,
      age: params.age,
      gender: params.gender,
      mobile: params.mobile,
      registrationDate
    };
  }

  static getAllPatients(): Patient[] {
    const stmt = db.prepare(`SELECT * FROM patients ORDER BY registration_date DESC`);
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      uhid: row.uhid,
      name: row.name,
      age: row.age,
      gender: row.gender,
      mobile: row.mobile,
      registrationDate: row.registration_date
    }));
  }
}
