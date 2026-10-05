# MediVoice AI — Hospital Voice Appointment Assistant

**MediVoice AI** is a production-style standalone web application designed for hospitals. It allows patients to call a hospital and book, reschedule, or cancel appointments through natural voice and text conversations with an AI assistant.

---

## 🌟 Key Features

1. **Anti-Double Booking Transaction Engine**: Atomic SQLite transactions (`EXCLUSIVE`) and database constraints prevent double booking of doctor slots.
2. **Strict Medical Safety Rules**: The AI **NEVER** diagnoses medical conditions. Emergency symptoms (chest pain, stroke, severe bleeding) trigger immediate escalation to hospital emergency protocols.
3. **Dynamic Symptom Routing**: Maps symptoms to appropriate hospital departments (e.g., Skin rash -> Dermatology, Toothache -> Dental).
4. **Browser Voice & Text Simulator**: Includes Web Speech API (Speech Recognition & Speech Synthesis) for microphone testing and a text mode for quick dev testing.
5. **Multi-Channel OPD Token Tracking**: Supports `AI Voice`, `Reception Desk`, and `Admin` booking channels.
6. **Operations Dashboard**: Real-time stats, call history inspector with transcript & intent extraction JSON, and immutable audit trail.
7. **MedGuard Ready Architecture**: Uses an abstract `IAppointmentService` interface so the backend can seamlessly connect to MedGuard hospital APIs in the future.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install & Start Backend Server
```bash
cd server
npm install
npm run dev
```
Backend runs at `http://localhost:5000`

### 2. Install & Start Frontend Dashboard
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, TypeScript, SQLite (better-sqlite3), Google Gemini API / Rule Engine
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons, Web Speech API
