import { db } from '../db/database';
import { AuditEvent } from '../models/types';

export class AuditService {
  static logEvent(params: {
    callId?: string;
    patientId?: string;
    action: AuditEvent['action'];
    details?: Record<string, any>;
    channel?: 'ai_voice' | 'reception' | 'admin';
  }): AuditEvent {
    const id = `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();
    const channel = params.channel || 'ai_voice';
    const detailsJson = params.details ? JSON.stringify(params.details) : null;

    const stmt = db.prepare(`
      INSERT INTO audit_events (id, timestamp, call_id, patient_id, action, details, channel)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, timestamp, params.callId || null, params.patientId || null, params.action, detailsJson, channel);

    return {
      id,
      timestamp,
      callId: params.callId,
      patientId: params.patientId,
      action: params.action,
      details: params.details,
      channel
    };
  }

  static getAuditEvents(limit: number = 100): AuditEvent[] {
    const stmt = db.prepare(`
      SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];

    return rows.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      callId: r.call_id,
      patientId: r.patient_id,
      action: r.action,
      details: r.details ? JSON.parse(r.details) : undefined,
      channel: r.channel
    }));
  }
}
