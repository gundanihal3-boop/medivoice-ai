import React from 'react';
import { Activity, PhoneCall, Calendar, History, ShieldAlert, Settings, RefreshCw, Bot } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onResetDemo: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onResetDemo, isSeeding }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'live_call', label: 'Live Simulator', icon: PhoneCall },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'call_history', label: 'Call Logs', icon: History },
    { id: 'audit_log', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'admin_config', label: 'Admin Config', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-health-600 text-white flex items-center justify-center shadow-md shadow-health-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">MediVoice AI</span>
                <span className="bg-health-100 text-health-700 text-xs font-semibold px-2 py-0.5 rounded-full border border-health-200">
                  Hospital Assistant
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Standalone Voice & Appointment Operations</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-health-50 text-health-700 border border-health-200/80 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-health-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Backend Connected</span>
            </div>

            <button
              onClick={onResetDemo}
              disabled={isSeeding}
              className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all disabled:opacity-50"
              title="Reset database with preset demo patients, doctors, and calls"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Seeding...' : 'Demo Seed Mode'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden border-t border-slate-100 py-2 flex overflow-x-auto space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive ? 'bg-health-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
