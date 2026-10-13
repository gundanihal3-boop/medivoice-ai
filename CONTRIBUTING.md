# Contributing to MediVoice AI 🩺

Thank you for your interest in contributing to **MediVoice AI**! We welcome contributions from developers, healthcare technologists, UI/UX designers, and technical writers of all skill levels.

---

## 🧭 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in all discussions, issues, and pull requests.

---

## 🚀 How Can You Contribute?

You can contribute to MediVoice AI in many ways:
- 🐛 **Reporting bugs & edge cases** (e.g. speech recognition fallbacks, appointment edge cases).
- 💡 **Suggesting new features** (e.g. SMS reminders, multilingual support, calendar integrations).
- 🩺 **Enhancing clinical routing rules** (refining symptom-to-specialty mappings and emergency escalation keywords).
- 🎨 **Improving the UI/UX** (sound waveforms, accessibility / WCAG compliance, mobile responsiveness).
- 🧪 **Writing automated tests** (unit tests for appointment booking transactions, API integration tests).
- 📝 **Improving documentation** (API docs, setup guides, architecture diagrams).

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js** (v18.x or v20.x+)
- **npm** (v9+)
- **Git**

### 2. Fork and Clone
```bash
# Clone your fork
git clone https://github.com/<your-username>/medivoice-ai.git
cd medivoice-ai
```

### 3. Backend Setup
```bash
cd server
npm install
npm run seed     # Initializes and seeds the SQLite database
npm run dev      # Starts server with hot reloading on port 5000
```

### 4. Frontend Setup
```bash
cd ../client
npm install
npm run dev      # Starts Vite dev server on port 3000
```

Open `http://localhost:3000` in your browser. (The backend proxy serves APIs at `http://localhost:5000`).

---

## 🧪 Development Guidelines

### Branching Convention
Create a branch with a descriptive prefix:
- `feat/feature-name` (e.g., `feat/sms-confirmation`)
- `fix/bug-description` (e.g., `fix/mic-permission-firefox`)
- `docs/doc-update` (e.g., `docs/api-reference`)
- `refactor/component-name` (e.g., `refactor/audio-visualizer`)

### Code Style & Formatting
- **TypeScript**: Strive for strict types without using `any` wherever possible.
- **Safety First**: Never bypass or weaken emergency escalation keywords in medical routing.
- **Transactions**: Any appointment booking, cancellation, or rescheduling must preserve atomic SQLite transactions (`EXCLUSIVE` mode).
- Verify builds before pushing:
  ```bash
  # In server/
  npm run build

  # In client/
  npm run build
  ```

---

## 📬 Submitting a Pull Request (PR)

1. **Commit cleanly**: Write concise, descriptive commit messages following Conventional Commits format (`feat: ...`, `fix: ...`, `docs: ...`).
2. **Push your branch**:
   ```bash
   git push origin feat/your-feature-name
   ```
3. **Open a Pull Request**:
   - Provide a clear title and description explaining the problem solved or feature added.
   - Link any related issues (e.g. `Resolves #12`).
   - Include screenshots or screen recordings for UI modifications.
4. **Respond to feedback**: Reviewers may suggest edits. Push updates directly to your branch to update the PR.

---

## 🌟 Good First Issues

Looking for places to start? Check out:
- Adding additional symptom keywords to `server/src/services/routingService.ts`.
- Enhancing speech recognition browser compatibility and noise suppression controls.
- Exporting appointment schedules and token logs as CSV or PDF.
- Adding automated Vitest/Jest unit tests for core services.

Thank you for helping make healthcare appointment scheduling faster and more accessible!
