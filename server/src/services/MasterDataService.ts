import { db } from '../db/database';
import { Department, Doctor, RoutingRule } from '../models/types';

export class MasterDataService {
  static getDepartments(): Department[] {
    const stmt = db.prepare(`SELECT * FROM departments WHERE is_active = 1 ORDER BY name ASC`);
    const rows = stmt.all() as any[];
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      description: r.description,
      isActive: Boolean(r.is_active)
    }));
  }

  static getDoctors(departmentId?: string): Doctor[] {
    let sql = `SELECT * FROM doctors WHERE status = 'active'`;
    const params: any[] = [];
    if (departmentId) {
      sql += ` AND department_id = ?`;
      params.push(departmentId);
    }
    sql += ` ORDER BY name ASC`;

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      departmentId: r.department_id,
      qualification: r.qualification,
      availableDays: JSON.parse(r.available_days || '[]'),
      workingStart: r.working_start,
      workingEnd: r.working_end,
      slotDurationMinutes: r.slot_duration_minutes,
      status: r.status
    }));
  }

  static getDoctorById(id: string): Doctor | null {
    const stmt = db.prepare(`SELECT * FROM doctors WHERE id = ?`);
    const r = stmt.get(id) as any;
    if (!r) return null;

    return {
      id: r.id,
      name: r.name,
      departmentId: r.department_id,
      qualification: r.qualification,
      availableDays: JSON.parse(r.available_days || '[]'),
      workingStart: r.working_start,
      workingEnd: r.working_end,
      slotDurationMinutes: r.slot_duration_minutes,
      status: r.status
    };
  }

  static getRoutingRules(): RoutingRule[] {
    const stmt = db.prepare(`SELECT * FROM routing_rules`);
    const rows = stmt.all() as any[];

    return rows.map(r => ({
      id: r.id,
      symptomKeywords: JSON.parse(r.symptom_keywords || '[]'),
      departmentId: r.department_id,
      urgencyDefault: r.urgency_default,
      notes: r.notes
    }));
  }

  static findDepartmentBySymptom(symptomOrReason: string): { department: Department; urgency: 'routine' | 'potentially_urgent' | 'emergency' } | null {
    const text = symptomOrReason.toLowerCase();
    const rules = this.getRoutingRules();

    for (const rule of rules) {
      const match = rule.symptomKeywords.some(kw => text.includes(kw.toLowerCase()));
      if (match) {
        const departments = this.getDepartments();
        const dept = departments.find(d => d.id === rule.departmentId || d.code === rule.departmentId);
        if (dept) {
          return {
            department: dept,
            urgency: rule.urgencyDefault
          };
        }
      }
    }

    return null;
  }

  static getHospitalSettings(): Record<string, string> {
    const stmt = db.prepare(`SELECT key, value FROM hospital_settings`);
    const rows = stmt.all() as any[];
    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  static setHospitalSetting(key: string, value: string, description?: string): void {
    const stmt = db.prepare(`
      INSERT INTO hospital_settings (key, value, description)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, description = COALESCE(excluded.description, hospital_settings.description)
    `);
    stmt.run(key, value, description || null);
  }
}
