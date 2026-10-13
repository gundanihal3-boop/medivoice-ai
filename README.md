# MediVoice AI — Hospital Voice Appointment Assistant

[![CI](https://github.com/gundanihal3-boop/medivoice-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/gundanihal3-boop/medivoice-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)

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
npm run seed     # Seed doctors, schedules, and routing rules
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

---

## 🤝 Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!

Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for details on how to set up your environment, open issues, and submit pull requests.

### 🌟 Areas Where We Need Help:
- [ ] Multilingual speech recognition & synthesis (Spanish, Hindi, French)
- [ ] SMS / WhatsApp appointment confirmation notifications
- [ ] Exporting appointment schedules and token logs as CSV / PDF
- [ ] Unit & integration test suites (Vitest / Jest)
- [ ] Dark / Light mode accessibility enhancements

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
