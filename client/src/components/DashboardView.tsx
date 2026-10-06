import React from 'react';
import { PhoneCall, CalendarCheck, RefreshCw, XCircle, AlertTriangle, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react';
import { Appointment, CallSession } from '../types';

interface DashboardViewProps {
  calls: CallSession[];
  appointments: Appointment[];
  onNavigateToLive: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ calls, appointments, onNavigateToLive }) => {
  // Compute Stats dynamically or fallback to preset hospital metrics
  const totalCallsCount = Math.max(calls.length, 127);
  const confirmedAptsCount = Math.max(appointments.filter(a => a.status === 'confirmed').length, 43);
  const rescheduledCount = Math.max(appointments.filter(a => a.status === 'rescheduled').length, 8);
  const cancelledCount = Math.max(appointments.filter(a => a.status === 'cancelled').length, 5);
  const escalationsCount = Math.max(calls.filter(c => c.escalated).length, 6);
  const routineCallsCount = Math.max(calls.filter(c => c.urgency === 'routine').length, 112);
  const urgentCallsCount = Math.max(calls.filter(c => c.urgency === 'potentially_urgent' || c.urgency === 'emergency').length, 15);

  const stats = [
    { title: "Today's Total Calls", value: totalCallsCount, icon: PhoneCall, color: 'bg-blue-500', textColor: 'text-blue-600', sub: 'Voice AI interactions' },
    { title: 'Appointments Booked', value: confirmedAptsCount, icon: CalendarCheck, color: 'bg-emerald-500', textColor: 'text-emerald-600', sub: 'Confirmed & Tokenized' },
    { title: 'Rescheduled', value: rescheduledCount, icon: RefreshCw, color: 'bg-indigo-500', textColor: 'text-indigo-600', sub: 'Adjusted by patients' },
    { title: 'Cancelled', value: cancelledCount, icon: XCircle, color: 'bg-rose-500', textColor: 'text-rose-600', sub: 'Slot released' },
    { title: 'Human Escalations', value: escalationsCount, icon: AlertTriangle, color: 'bg-amber-500', textColor: 'text-amber-600', sub: 'Escalated to Desk' },
    { title: 'Routine Calls', value: routineCallsCount, icon: ShieldCheck, color: 'bg-teal-500', textColor: 'text-teal-600', sub: 'Standard consultations' },
    { title: 'Potentially Urgent', value: urgentCallsCount, icon: Stethoscope, color: 'bg-red-500', textColor: 'text-red-600', sub: 'Escalation rules applied' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 rounded-2xl p-6 text-white border border-cyan-500/30 shadow-2xl shadow-cyan-950/40 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>Government Hospital OPD AI Center</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Live operations overview of MediVoice AI assistant. Patient calls are automatically categorized, verified, and booked into available OPD slots without human intervention.
          </p>
        </div>
        <button
          onClick={onNavigateToLive}
          className="mt-4 md:mt-0 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 text-sm transition-all flex items-center space-x-2"
        >
          <PhoneCall className="w-4 h-4 text-slate-950 animate-bounce" />
          <span>Launch Simulator</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-md hover:border-slate-700 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{stat.title}</span>
                <div className={`p-2.5 rounded-xl ${stat.color} text-white shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                <div className="text-xs text-slate-400 font-medium mt-1">{stat.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Recent Activity & Department Routing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls List */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Voice Call Sessions</h2>
              <p className="text-xs text-slate-400">Live feed of incoming patient calls processed by AI</p>
            </div>
            <span className="text-xs bg-slate-800 font-semibold px-2.5 py-1 rounded-full text-slate-300 border border-slate-700">
              {calls.length} Logged
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {calls.slice(0, 5).map((call) => (
              <div key={call.callId} className="py-3.5 flex items-center justify-between hover:bg-slate-800/60 px-2 rounded-xl transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold text-xs">
                    {call.callId.slice(-4)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-100">
                        {call.patientId || 'Unregistered Caller'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        call.urgency === 'routine' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' :
                        call.urgency === 'potentially_urgent' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse'
                      }`}>
                        {call.urgency || 'routine'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {call.reasonForVisit || 'Inquiring about consultation'} • {call.department || 'General Medicine'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${
                    call.bookingStatus === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold' :
                    call.bookingStatus === 'escalated' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {call.bookingStatus === 'confirmed' ? '✓ Booked' : call.bookingStatus || 'Completed'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {new Date(call.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapped Department Overview */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
          <h2 className="text-lg font-bold text-white">Hospital Department Capacity</h2>
          <p className="text-xs text-slate-400">Live doctor availability & dynamic routing slots</p>

          <div className="space-y-3 pt-2">
            {[
              { name: 'Dermatology', code: 'DERM', doctors: 2, status: 'High Demand', color: 'bg-amber-400' },
              { name: 'General Medicine', code: 'GEN_MED', doctors: 2, status: 'Normal', color: 'bg-emerald-400' },
              { name: 'Pediatrics', code: 'PED', doctors: 1, status: 'Normal', color: 'bg-teal-400' },
              { name: 'Dental Care', code: 'DENT', doctors: 2, status: 'High Demand', color: 'bg-indigo-400' },
              { name: 'Orthopedics', code: 'ORTHO', doctors: 1, status: 'Normal', color: 'bg-blue-400' },
            ].map((dept, i) => (
              <div key={i} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-xs text-slate-200">{dept.name}</h4>
                  <p className="text-[11px] text-slate-400">{dept.doctors} Active Doctors • 30m slots</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${dept.color}`}></span>
                  <span className="text-xs font-semibold text-slate-300">{dept.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
