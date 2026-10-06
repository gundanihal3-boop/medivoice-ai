import React from 'react';
import { Settings, Stethoscope, UserCheck, ShieldAlert, Sliders, CheckCircle } from 'lucide-react';
import { Department, Doctor, RoutingRule } from '../types';

interface AdminConfigViewProps {
  departments: Department[];
  doctors: Doctor[];
  routingRules: RoutingRule[];
  settings: Record<string, string>;
}

export const AdminConfigView: React.FC<AdminConfigViewProps> = ({
  departments,
  doctors,
  routingRules,
  settings
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md">
        <h2 className="text-xl font-bold text-white">Hospital System & AI Configuration</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Dynamic database-stored routing rules, hospital emergency protocols, and doctor schedule limits (No code re-deploy required)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Symptom Routing Rules */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Symptom-to-Department Routing Rules</h3>
            </div>
            <span className="text-xs bg-slate-800 font-semibold px-2.5 py-1 rounded-full text-slate-300 border border-slate-700">
              {routingRules.length} Configured Rules
            </span>
          </div>

          <div className="space-y-3">
            {routingRules.map((rule) => {
              const dept = departments.find(d => d.id === rule.departmentId || d.code === rule.departmentId);
              return (
                <div key={rule.id} className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      ➜ {dept ? dept.name : rule.departmentId}
                    </span>
                    <span className="text-[10px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 uppercase">
                      Default: {rule.urgencyDefault}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">Trigger Keywords:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.symptomKeywords.map((kw, i) => (
                        <span key={i} className="bg-slate-900 border border-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          "{kw}"
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hospital Info & Emergency Protocol Settings */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-white text-sm">Emergency Protocols & Hospital Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Hospital Name</label>
                <input
                  type="text"
                  readOnly
                  value={settings['hospital_name'] || 'Government General Hospital'}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Emergency Desk Hotline</label>
                <input
                  type="text"
                  readOnly
                  value={settings['emergency_phone'] || '+91-1800-112-911'}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Emergency AI Escalation Protocol</label>
                <textarea
                  readOnly
                  rows={3}
                  value={settings['emergency_protocol'] || "Immediately route to hospital emergency room desk or dispatch ambulance."}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl font-medium text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Active Doctor Roster */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Stethoscope className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white text-sm">Doctor Shift Schedules</h3>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto pr-1">
              {doctors.map((doc) => {
                const dept = departments.find(d => d.id === doc.departmentId);
                return (
                  <div key={doc.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-100">{doc.name} ({doc.id})</div>
                      <div className="text-slate-400">{dept?.name} • {doc.qualification}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-200">{doc.workingStart} - {doc.workingEnd}</div>
                      <div className="text-[10px] text-slate-500">{doc.availableDays.slice(0, 3).join(', ')} • {doc.slotDurationMinutes}m slots</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
