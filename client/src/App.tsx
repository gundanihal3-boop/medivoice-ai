import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { LiveCallView } from './components/LiveCallView';
import { AppointmentsView } from './components/AppointmentsView';
import { CallHistoryView } from './components/CallHistoryView';
import { AuditLogView } from './components/AuditLogView';
import { AdminConfigView } from './components/AdminConfigView';
import { Appointment, AuditEvent, CallSession, Department, Doctor, Patient, RoutingRule } from './types';
import { fetchAdminSettings, fetchAppointments, fetchAuditLogs, fetchCalls, fetchDepartments, fetchDoctors, fetchPatients, seedDemoData } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Core Data States
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calls, setCalls] = useState<CallSession[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const refreshAllData = async () => {
    try {
      const [deptRes, docRes, patRes, aptRes, callRes, auditRes, adminRes] = await Promise.all([
        fetchDepartments(),
        fetchDoctors(),
        fetchPatients(),
        fetchAppointments(),
        fetchCalls(),
        fetchAuditLogs(),
        fetchAdminSettings()
      ]);

      setDepartments(deptRes);
      setDoctors(docRes);
      setPatients(patRes);
      setAppointments(aptRes);
      setCalls(callRes);
      setAuditEvents(auditRes);
      setRoutingRules(adminRes.routingRules);
      setSettings(adminRes.settings);
    } catch (err: any) {
      console.error('Error fetching data from MediVoice backend:', err);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleResetDemo = async () => {
    try {
      setIsSeeding(true);
      await seedDemoData();
      await refreshAllData();
    } catch (err: any) {
      alert('Error seeding demo data: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onResetDemo={handleResetDemo}
        isSeeding={isSeeding}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            calls={calls}
            appointments={appointments}
            onNavigateToLive={() => setActiveTab('live_call')}
          />
        )}

        {activeTab === 'live_call' && (
          <LiveCallView
            onCallUpdated={refreshAllData}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsView
            appointments={appointments}
            departments={departments}
            doctors={doctors}
            patients={patients}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'call_history' && (
          <CallHistoryView
            calls={calls}
            patients={patients}
          />
        )}

        {activeTab === 'audit_log' && (
          <AuditLogView
            auditEvents={auditEvents}
          />
        )}

        {activeTab === 'admin_config' && (
          <AdminConfigView
            departments={departments}
            doctors={doctors}
            routingRules={routingRules}
            settings={settings}
          />
        )}
      </main>

      <footer className="bg-slate-900/80 backdrop-blur-md border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <p>MediVoice AI • Hospital Voice Appointment Assistant • Standalone Architecture (MedGuard Ready)</p>
      </footer>
    </div>
  );
}

export default App;
