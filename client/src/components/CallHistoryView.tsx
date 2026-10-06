import React, { useState } from 'react';
import { History, Search, ChevronRight, ShieldAlert, Bot, User, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { CallSession, Patient } from '../types';

interface CallHistoryViewProps {
  calls: CallSession[];
  patients: Patient[];
}

export const CallHistoryView: React.FC<CallHistoryViewProps> = ({ calls, patients }) => {
  const [selectedCall, setSelectedCall] = useState<CallSession | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCalls = calls.filter(call => {
    const searchLower = searchQuery.toLowerCase();
    const patient = patients.find(p => p.id === call.patientId);

    return !searchQuery ||
      call.callId.toLowerCase().includes(searchLower) ||
      (call.reasonForVisit && call.reasonForVisit.toLowerCase().includes(searchLower)) ||
      (call.department && call.department.toLowerCase().includes(searchLower)) ||
      (patient && (patient.name.toLowerCase().includes(searchLower) || patient.uhid.toLowerCase().includes(searchLower)));
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Voice Call Session Logs</h2>
          <p className="text-xs text-slate-400 font-medium">
            Inspect full AI voice transcripts, extracted intent objects, and escalation histories
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search Call ID, Patient, Reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Main Grid: Call Table & Slide-Over Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calls Table */}
        <div className={`${selectedCall ? 'lg:col-span-2' : 'lg:col-span-3'} bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4">Call ID & Time</th>
                  <th className="p-4">Patient Details</th>
                  <th className="p-4">Reason & Dept</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                      No call records found.
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => {
                    const patient = patients.find(p => p.id === call.patientId);
                    const isSelected = selectedCall?.callId === call.callId;

                    return (
                      <tr
                        key={call.callId}
                        onClick={() => setSelectedCall(call)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-cyan-500/10 font-medium' : 'hover:bg-slate-800/60'}`}
                      >
                        <td className="p-4">
                          <div className="font-bold text-slate-100">{call.callId}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-100">{patient ? patient.name : (call.patientId || 'Unregistered')}</div>
                          <div className="text-[11px] text-slate-400">{patient ? `UHID: ${patient.uhid}` : 'Pending registration'}</div>
                        </td>

                        <td className="p-4">
                          <div className="font-semibold text-slate-200">{call.reasonForVisit || 'General Inquiry'}</div>
                          <div className="text-[11px] text-slate-400">{call.department || 'General Medicine'}</div>
                        </td>

                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            call.urgency === 'routine' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' :
                            call.urgency === 'potentially_urgent' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}>
                            {call.urgency || 'routine'}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                            call.bookingStatus === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            call.escalated ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {call.escalated ? '⚠️ Escalated' : (call.bookingStatus || 'Completed')}
                          </span>
                        </td>

                        <td className="p-4 text-right">
                          <ChevronRight className="w-4 h-4 text-slate-400 inline-block" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Inspector Drawer */}
        {selectedCall && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 flex flex-col h-[650px] overflow-hidden text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-sm">Call Transcript & Intent Inspector</h3>
                <span className="text-xs font-mono text-cyan-400">{selectedCall.callId}</span>
              </div>
              <button onClick={() => setSelectedCall(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕ Close</button>
            </div>

            {/* Extracted Intent JSON summary */}
            <div className="bg-slate-950 border border-slate-800 text-emerald-400 rounded-xl p-3 text-[11px] font-mono overflow-x-auto space-y-1">
              <div className="text-slate-400 font-sans text-[10px] uppercase tracking-wider font-bold mb-1">
                Extracted AI Intent Object:
              </div>
              <pre>{JSON.stringify(selectedCall.extractedIntent || {
                reason_for_visit: selectedCall.reasonForVisit,
                urgency: selectedCall.urgency,
                department: selectedCall.department,
                selected_slot: selectedCall.selectedSlot
              }, null, 2)}</pre>
            </div>

            {/* Transcript Messages Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {selectedCall.transcript.map((msg, idx) => {
                const isAi = msg.speaker === 'ai';
                return (
                  <div key={idx} className={`p-3 rounded-xl text-xs space-y-1 ${isAi ? 'bg-slate-800/90 border border-slate-700/80 text-slate-100' : 'bg-cyan-600 text-slate-950 font-medium'}`}>
                    <div className={`flex justify-between text-[10px] font-bold ${isAi ? 'text-slate-400' : 'text-slate-900/80'}`}>
                      <span>{isAi ? 'MediVoice AI' : 'Patient'}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
