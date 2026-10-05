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
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Hospital System & AI Configuration</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Dynamic database-stored routing rules, hospital emergency protocols, and doctor schedule limits (No code re-deploy required)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dynamic Symptom Routing Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-health-600" />
              <h3 className="font-bold text-slate-900 text-sm">Symptom-to-Department Routing Rules</h3>
            </div>
            <span className="text-xs bg-slate-100 font-semibold px-2.5 py-1 rounded-full text-slate-600">
              {routingRules.length} Configured Rules
            </span>
          </div>

          <div className="space-y-3">
            {routingRules.map((rule) => {
              const dept = departments.find(d => d.id === rule.departmentId || d.code === rule.departmentId);
              return (
                <div key={rule.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-health-700 bg-health-100 px-2.5 py-0.5 rounded border border-health-200">
                      ➜ {dept ? dept.name : rule.departmentId}
                    </span>
                    <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
                      Default: {rule.urgencyDefault}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">Trigger Keywords:</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.symptomKeywords.map((kw, i) => (
                        <span key={i} className="bg-white border border-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded font-mono">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-slate-900 text-sm">Emergency Protocols & Hospital Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">Hospital Name</label>
                <input
                  type="text"
                  readOnly
                  value={settings['hospital_name'] || 'Government General Hospital'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Emergency Desk Hotline</label>
                <input
                  type="text"
                  readOnly
                  value={settings['emergency_phone'] || '+91-1800-112-911'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">Emergency AI Escalation Protocol</label>
                <textarea
                  readOnly
                  rows={3}
                  value={settings['emergency_protocol'] || "Immediately route to hospital emergency room desk or dispatch ambulance."}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Active Doctor Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Stethoscope className="w-5 h-5 text-health-600" />
              <h3 className="font-bold text-slate-900 text-sm">Doctor Shift Schedules</h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {doctors.map((doc) => {
                const dept = departments.find(d => d.id === doc.departmentId);
                return (
                  <div key={doc.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{doc.name} ({doc.id})</div>
                      <div className="text-slate-500">{dept?.name} • {doc.qualification}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-700">{doc.workingStart} - {doc.workingEnd}</div>
                      <div className="text-[10px] text-slate-400">{doc.availableDays.slice(0, 3).join(', ')} • {doc.slotDurationMinutes}m slots</div>
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
