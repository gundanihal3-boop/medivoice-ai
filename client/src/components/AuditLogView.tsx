import React, { useState } from 'react';
import { ShieldAlert, Filter, Search, Terminal } from 'lucide-react';
import { AuditEvent } from '../types';

interface AuditLogViewProps {
  auditEvents: AuditEvent[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditEvents }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const filteredEvents = auditEvents.filter(event => {
    const matchesAction = selectedAction === 'all' || event.action === selectedAction;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      event.id.toLowerCase().includes(searchLower) ||
      (event.callId && event.callId.toLowerCase().includes(searchLower)) ||
      (event.patientId && event.patientId.toLowerCase().includes(searchLower)) ||
      event.action.toLowerCase().includes(searchLower);

    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Hospital Operational Audit Trail</h2>
            <p className="text-xs text-slate-400 font-medium">
              Immutable ledger of system events, intent extractions, appointment bookings, and safety escalations
            </p>
          </div>
          <span className="text-xs bg-slate-800 font-mono font-bold px-3 py-1.5 rounded-xl text-cyan-400 border border-slate-700">
            {auditEvents.length} Recorded Events
          </span>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search Event ID, Call ID, Patient ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Action Types</option>
              <option value="CALL_STARTED">CALL_STARTED</option>
              <option value="PATIENT_IDENTIFIED">PATIENT_IDENTIFIED</option>
              <option value="INTENT_DETECTED">INTENT_DETECTED</option>
              <option value="DEPARTMENT_SELECTED">DEPARTMENT_SELECTED</option>
              <option value="AVAILABILITY_CHECKED">AVAILABILITY_CHECKED</option>
              <option value="APPOINTMENT_CREATED">APPOINTMENT_CREATED</option>
              <option value="APPOINTMENT_CANCELLED">APPOINTMENT_CANCELLED</option>
              <option value="HUMAN_ESCALATION">HUMAN_ESCALATION</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Log List */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md overflow-hidden divide-y divide-slate-800/80">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-medium">
            No audit records found matching criteria.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="p-4 hover:bg-slate-800/60 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div className="flex items-start space-x-3.5">
                <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700 font-mono text-xs font-bold shrink-0">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-100 font-mono">{event.action}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-semibold uppercase">
                      {event.channel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 space-x-3">
                    {event.callId && <span>Call: <strong className="text-slate-200">{event.callId}</strong></span>}
                    {event.patientId && <span>Patient: <strong className="text-slate-200">{event.patientId}</strong></span>}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto text-left md:text-right">
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
                {event.details && (
                  <div className="mt-1 bg-slate-950 text-emerald-400 text-[10px] font-mono p-2 rounded-lg max-w-md border border-slate-800 overflow-x-auto">
                    {JSON.stringify(event.details)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
