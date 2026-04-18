# MC Dashboard

> Multi-Cloud Order Management Dashboard

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-blue.svg)](.node-version)
[![TypeScript](https://img.shields.io/badge/typescript-%7E5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/vite-%236.2.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%234.1.14-38bdf8.svg)](https://tailwindcss.com/)

A modern order management dashboard built with React 19, TypeScript, and Vite. Designed for teams to manage orders, customers, and reports in one place.

---

## ✨ Features

- **📊 Dashboard** — Overview of orders, metrics, and key data
- **📦 Order Management** — Create, view, and track orders
- **👥 Customer Management** — Customer profiles and history
- **📈 Reports** — Data visualization with Recharts
- **🔗 Quick Links** — Fast access to external tools and resources
- **📋 Audit Log** — Activity tracking and logging
- **🔐 Role-Based Access Control** — Permission hierarchy (User → Admin → Global Admin → Developer)
- **🎓 Tutor Mode** — Interactive guided tooltips for new users

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 |
| Language | TypeScript ~5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Charts | Recharts |
| Icons | Lucide React |
| Animations | Motion (Framer Motion) |
| AI Integration | Google Gemini (`@google/genai`) |
| Deployment | Cloudflare Pages |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20 (check with `node --version`)
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/kenstudenthk/mc-dashboard.git
cd mc-dashboard

# Install dependencies
npm install
```

### Configuration

Copy the environment example file and add your API key:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development

```bash
# Start the dev server
npm run dev

# Open http://localhost:3000
```

### Build & Deploy

```bash
# Production build
npm run build

# Preview production build locally
npm run preview

# Deploy to Cloudflare Pages
npm run deploy
```

### Other Commands

```bash
npm run lint        # TypeScript type-check only
npm run clean       # Remove build output (dist/)
```

---

## 📁 Project Structure

```
mc-dashboard/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/          # React Context providers
│   │   ├── PermissionContext.tsx   # Role-based access control
│   │   └── TutorContext.tsx        # Tutor Mode toggle
│   ├── pages/             # Page components (routes)
│   ├── services/          # API service layer (planned)
│   └── index.css          # Tailwind theme & design tokens
├── scripts/               # Build & setup scripts
├── CLAUDE.md              # Claude Code guidance
├── DESIGN.md              # Design documentation
├── plan.md                # Project plan
└── wrangler.toml          # Cloudflare Pages config
```

---

## 🔑 Permission System

The app uses a role hierarchy:

| Role | Level |
|------|-------|
| User | 1 |
| Admin | 2 |
| Global Admin | 3 |
| Developer | 4 |

Switch roles live via the **TopNav dropdown** for testing and development.

---

## 📖 Documentation

- [CLAUDE.md](CLAUDE.md) — Developer guidance for Claude Code
- [DESIGN.md](DESIGN.md) — Detailed design system documentation
- [plan.md](plan.md) — Project plan and milestones

---

## 📄 License

Private project — all rights reserved.
