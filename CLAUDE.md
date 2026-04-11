# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules

Project-specific rules are in `.claude/rules/`:

| File | Purpose |
|---|---|
| `workflow.md` | Collaboration rules: approval before coding, scope limits, bug-fix process |
| `code-style.md` | Immutability, component size, TypeScript conventions |
| `testing.md` | Vitest setup, TDD requirements, coverage targets |
| `api-conventions.md` | Service layer pattern, API response format, Gemini usage |

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (TypeScript compile + Vite bundle)
npm run lint      # Type-check only (tsc --noEmit); no ESLint configured
npm run preview   # Preview production build locally
```

No test framework is configured. When adding tests, set up Vitest (already compatible with Vite) and Playwright for E2E.

## Environment

Copy `.env.example` to `.env.local` and set:
- `GEMINI_API_KEY` — Google Gemini API key (injected at build time via `vite.config.ts`)

## Architecture

**Tech stack**: React 19, TypeScript, Vite 6, Tailwind CSS v4 (via `@tailwindcss/vite`), React Router DOM v7, Recharts, Lucide React, Motion (Framer Motion), `@google/genai`.

### Context Providers (wrap the entire app in order)

1. **`PermissionContext`** (`src/contexts/PermissionContext.tsx`) — Role-based access with a hierarchy: `User (1) < Admin (2) < Global Admin (3) < Developer (4)`. Use `usePermission()` and `hasPermission(requiredRole)` to gate features. Default role is `Global Admin`. Role can be switched live via TopNav dropdown.

2. **`TutorContext`** (`src/contexts/TutorContext.tsx`) — Toggles "Tutor Mode" globally. When active, `TutorTooltip` wrappers become visible with contextual guidance text shown on hover.

### Component Conventions

- **`TutorTooltip`** (`src/components/TutorTooltip.tsx`) — Wraps any UI element to add a purple dashed ring + bouncing help icon + hover tooltip when Tutor Mode is ON. Pass `text` (guidance), `position` (`top|bottom|left|right`), and optional `wrapperClass`. Renders children passthrough when tutor mode is off.
- **`Layout`** — Fixed structure: `<Sidebar>` + column of `<TopNav>` + `<main>`. Page content goes in `main`.

### Design System

Defined in `src/index.css` using Tailwind v4 `@theme`:

| Token | Value |
|---|---|
| `--color-primary` | `#094cb2` |
| `--color-primary-light` | `#e6f0ff` |
| `--color-surface` | `#f4f6f8` (page background) |
| `--color-surface-elevated` | `#ffffff` (cards) |

Utility classes: `.card` (white rounded card with shadow), `.gradient-cta` (blue gradient button), `.glass-panel` (frosted glass header), `.label-text` (uppercase tracking label font).

Fonts: Inter (body), Noto Serif (headings `h1–h6`), Public Sans (`.label-text`).

### Data

All page data is currently **hardcoded mock data** inside each page component. There is no API layer or backend yet.

The planned backend uses **SharePoint Lists + Power Automate HTTP flows** as the data layer. Data flow: `React App → src/services/<entity>Service.ts → HTTP POST → Power Automate → SharePoint`. Request envelope: `{ action, data, userEmail }`.

When adding real data fetching:
- Create `src/services/<entity>Service.ts` files (never `fetch()` directly in components)
- Store Power Automate URLs in `.env.local` as `VITE_API_<NAME>_URL`
- On app load, call `API_Permissions` with the user's email to initialise `PermissionContext` from SharePoint instead of using the hardcoded default role

### Routes

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/orders` | OrderRegistry |
| `/orders/new` | NewOrder |
| `/orders/:id` | OrderDetails |
| `/customers` | Customers |
| `/customers/:id` | CustomerProfile |
| `/reports` | Reports |
| `/quick-links` | QuickLinks |
| `/audit-log` | AuditLog |
| `/settings` | Settings |
| `/help` | Help |
