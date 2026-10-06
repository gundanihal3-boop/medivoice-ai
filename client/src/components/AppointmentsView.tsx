import React, { useState } from 'react';
import { Calendar, Filter, Plus, Search, CheckCircle, XCircle, Clock, Tag } from 'lucide-react';
import { Appointment, Department, Doctor, Patient } from '../types';
import { bookAppointment, cancelAppointment } from '../api';

interface AppointmentsViewProps {
  appointments: Appointment[];
  departments: Department[];
  doctors: Doctor[];
  patients: Patient[];
  onRefresh: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  departments,
  doctors,
  patients,
  onRefresh
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showBookModal, setShowBookModal] = useState<boolean>(false);

  // New Booking Form State
  const [newPatientId, setNewPatientId] = useState<string>('');
  const [newDeptId, setNewDeptId] = useState<string>('');
  const [newDocId, setNewDocId] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('10:00');
  const [bookingError, setBookingError] = useState<string>('');

  const filteredAppointments = appointments.filter(apt => {
    const matchesChannel = selectedChannel === 'all' || apt.bookingChannel === selectedChannel;
    const matchesDept = selectedDept === 'all' || apt.departmentId === selectedDept;
    
    const patient = patients.find(p => p.id === apt.patientId);
    const doctor = doctors.find(d => d.id === apt.doctorId);
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = !searchQuery ||
      apt.id.toLowerCase().includes(searchLower) ||
      (patient && (patient.name.toLowerCase().includes(searchLower) || patient.uhid.toLowerCase().includes(searchLower))) ||
      (doctor && doctor.name.toLowerCase().includes(searchLower));

    return matchesChannel && matchesDept && matchesSearch;
  });

  const handleCancel = async (id: string) => {
    if (!confirm(`Are you sure you want to cancel appointment ${id}?`)) return;
    try {
      await cancelAppointment(id, 'Cancelled via Reception Dashboard');
      onRefresh();
    } catch (err: any) {
      alert('Failed to cancel appointment: ' + err.message);
    }
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    if (!newPatientId || !newDeptId || !newDocId || !newDate || !newTime) {
      setBookingError('Please fill out all required fields.');
      return;
    }

    try {
      await bookAppointment({
        patientId: newPatientId,
        departmentId: newDeptId,
        doctorId: newDocId,
        date: newDate,
        time: newTime,
        bookingChannel: 'reception',
        notes: 'Booked directly via Reception Desk UI'
      });
      setShowBookModal(false);
      onRefresh();
    } catch (err: any) {
      setBookingError(err.message || 'Double booking error or slot unavailable.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Hospital Appointment Management</h2>
            <p className="text-xs text-slate-400 font-medium">
              Multi-channel OPD Tokens & Slot Booking (AI Voice, Reception, Admin)
            </p>
          </div>

          <button
            onClick={() => setShowBookModal(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment (Reception)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Patient Name, or UHID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Booking Channels</option>
              <option value="ai_voice">AI Voice Assistant</option>
              <option value="reception">Reception Desk</option>
              <option value="admin">Admin Dashboard</option>
            </select>
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Appointment Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Appt ID & Token</th>
                <th className="p-4">Patient</th>
                <th className="p-4">Department & Doctor</th>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium">
                    No appointments found matching filters.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const patient = patients.find(p => p.id === apt.patientId);
                  const doctor = doctors.find(d => d.id === apt.doctorId);
                  const dept = departments.find(d => d.id === apt.departmentId);

                  return (
                    <tr key={apt.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-100">{apt.id}</div>
                        <div className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block mt-1">
                          OPD Token: #{apt.opdToken}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-100">{patient ? patient.name : apt.patientId}</div>
                        <div className="text-[11px] text-slate-400">UHID: {patient ? patient.uhid : 'N/A'} • {patient?.mobile}</div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-slate-200">{dept ? dept.name : apt.departmentId}</div>
                        <div className="text-[11px] text-slate-400">{doctor ? doctor.name : apt.doctorId}</div>
                      </td>

                      <td className="p-4 font-medium text-slate-300">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.date}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-400 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{apt.time}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          apt.bookingChannel === 'ai_voice' ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' :
                          apt.bookingChannel === 'reception' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {apt.bookingChannel === 'ai_voice' ? '🤖 AI Voice' : apt.bookingChannel}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                          apt.status === 'confirmed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                          apt.status === 'cancelled' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                          'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {apt.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        {apt.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(apt.id)}
                            className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 rounded hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Booking Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-100">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Book OPD Appointment (Reception Desk)</h3>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            {bookingError && (
              <div className="p-3 bg-red-500/10 text-red-300 text-xs rounded-xl font-medium border border-red-500/30">
                ⚠️ {bookingError}
              </div>
            )}

            <form onSubmit={handleManualBookingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Patient</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">-- Choose Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.uhid} - {p.mobile})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Department</label>
                <select
                  value={newDeptId}
                  onChange={(e) => {
                    setNewDeptId(e.target.value);
                    const docs = doctors.filter(d => d.departmentId === e.target.value);
                    if (docs.length > 0) setNewDocId(docs[0].id);
                  }}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Select Doctor</label>
                <select
                  value={newDocId}
                  onChange={(e) => setNewDocId(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  required
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.filter(d => !newDeptId || d.departmentId === newDeptId).map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name} ({doc.qualification})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Time Slot</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-100 rounded-xl focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="10:00">10:00 AM</option>
                    <option value="10:30">10:30 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="14:30">02:30 PM</option>
                    <option value="15:00">03:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 font-semibold rounded-xl text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-md transition-colors"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
