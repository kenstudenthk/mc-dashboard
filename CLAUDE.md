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

```
GEMINI_API_KEY                  # Google Gemini API key (injected at build time via vite.config.ts)

# Supabase — auth + feedback storage
VITE_SUPABASE_URL               # Supabase project URL
VITE_SUPABASE_ANON_KEY          # Supabase anon/public key
VITE_SUPABASE_SERVICE_ROLE_KEY  # (optional) service role key for admin operations (user invite/delete)

# Power Automate flow URLs — SharePoint data layer
VITE_API_CUSTOMERS_URL
VITE_API_ORDERS_URL
VITE_API_GET_PAGE_URL           # Paginated fetch (GET_PAGE action)
VITE_API_ORDER_TIMELINE_URL
VITE_API_AUDIT_LOGS_URL
VITE_API_QUICK_LINKS_URL
VITE_API_PERMISSIONS_URL
VITE_API_SERVICE_ACCOUNTS_URL
VITE_API_MASTER_LIST_URL
VITE_API_ORDER_STEPS_URL
VITE_API_EMAIL_TEMPLATES_URL
VITE_API_EMAIL_URL
```

## Architecture

**Tech stack**: React 19, TypeScript, Vite 6, Tailwind CSS v4 (via `@tailwindcss/vite`), React Router DOM v7, Recharts, Lucide React, Motion (Framer Motion), `@google/genai`, Supabase.

### Authentication

Authentication is handled by **Supabase Auth** (`src/lib/supabase.ts`). The app wraps all routes in an auth guard inside `PermissionContext`; unauthenticated users see `Login` instead of the app shell.

`Login` (`src/pages/Login.tsx`) handles: sign-in, forgot password, password reset (email link), forced first-login password change, and access-denied state.

`authService` (`src/services/authService.ts`) exposes `getIdentity`, `logout`, `sendPasswordResetEmail`, `inviteUser`, and `deleteUser`. Admin operations (`inviteUser`, `deleteUser`) require `VITE_SUPABASE_SERVICE_ROLE_KEY`.

### Context Providers (wrap the entire app in order)

1. **`PermissionProvider`** (`src/contexts/PermissionContext.tsx`) — Role-based access with a hierarchy: `User (1) < Admin (2) < Global Admin (3) < Developer (4)`. Checks Supabase session on mount, then calls `VITE_API_PERMISSIONS_URL` with the user's email to fetch the role from SharePoint. Exposes `usePermission()` and `hasPermission(requiredRole)` to gate features. Also owns auth state flags: `isAuthorized`, `loggedOut`, `forcePasswordChange`, `isPasswordRecovery`.

2. **`TutorProvider`** (`src/contexts/TutorContext.tsx`) — Toggles "Tutor Mode" globally. When active, `TutorTooltip` wrappers become visible with contextual guidance text shown on hover.

### Component Conventions

- **`TutorTooltip`** (`src/components/TutorTooltip.tsx`) — Wraps any UI element to add a purple dashed ring + bouncing help icon + hover tooltip when Tutor Mode is ON. Pass `text` (guidance), `position` (`top|bottom|left|right`), and optional `wrapperClass`. Renders children passthrough when tutor mode is off.
- **`Layout`** — Fixed structure: `<Sidebar>` + column of `<TopNav>` + `<main>`. Page content goes in `main`.
- **`CustomerCombobox`** (`src/components/CustomerCombobox.tsx`) — Searchable dropdown backed by `customerService`. Use when a form field needs a customer ID.
- **`ServiceAccountCombobox`** (`src/components/ServiceAccountCombobox.tsx`) — Searchable dropdown for service account lookup. Use in order forms.
- **`DataEditMode`** (`src/components/DataEditMode/`) — `DataEditTable` + `EditableCell` + `ColumnFilter` for inline table editing.
- **`BulkImport`** (`src/components/BulkImport/`) — Multi-step modal (Upload → Validate → Preview → Conflict → Importing) for CSV bulk imports.
- **`EmailComposePanel`** / **`EmailTemplateEditPanel`** — Slide-in panels for composing and editing email templates.
- **`RichTextEditor`** — Wrapper around a rich-text input, used in email template editing.
- **`ServiceTimeline`** — Visual timeline component for order/service history.
- **`CloudProviderLogo`** / **`ServiceProviderLogo`** — Render logos from `src/constants/cloudProviders.ts` and `src/constants/serviceProviders.ts`.

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

The **service layer** (`src/services/`) is live and connects to SharePoint via Power Automate HTTP flows. Most pages fetch real data; a few secondary pages may still use local fallbacks.

Data flow: `React component → src/services/<entity>Service.ts → HTTP POST → Power Automate → SharePoint`

Request envelope: `{ action, data, userEmail }`

**Supabase** is used for: authentication (`authService`) and feedback storage (`feedbackService`).

Service files:

| File | Entity |
|---|---|
| `orderService.ts` | Orders |
| `customerService.ts` | Customers |
| `serviceAccountService.ts` | Service accounts |
| `orderTimelineService.ts` | Order timeline events |
| `orderStepsService.ts` | Order checklist steps |
| `auditLogService.ts` | Audit log entries |
| `quickLinkService.ts` | Quick links |
| `permissionService.ts` | User permissions (SharePoint) |
| `emailTemplateService.ts` | Email templates + `normalizeCloudProvider` |
| `emailService.ts` | Send email via Power Automate |
| `feedbackService.ts` | Feedback (Supabase) |
| `authService.ts` | Auth operations (Supabase) |
| `bulkImportService.ts` | Bulk CSV import logic |
| `pinnedOrderService.ts` | Pinned orders (local storage) |
| `useOrdersQuery.ts` | React hook wrapping order fetch with caching |

Rules:
- Never call `fetch()` directly in components — always use a service
- Store Power Automate URLs in `.env.local` as `VITE_API_<NAME>_URL`
- Validate all API responses at the boundary before using in UI

### Routes

| Path | Page |
|---|---|
| `/` | Dashboard |
| `/orders` | OrderRegistry |
| `/orders/new` | NewOrder |
| `/orders/:id` | OrderDetails |
| `/customers` | Customers |
| `/customers/:id` | CustomerProfile |
| `/services` | ServiceCatalog |
| `/services/:id` | ServiceDetails |
| `/reports` | Reports |
| `/quick-links` | QuickLinks |
| `/audit-log` | AuditLog |
| `/email-templates` | EmailTemplates |
| `/settings` | Settings |
| `/help` | Help |
| `/feedback` | Feedback |
| `/feedback/new` | FeedbackNew |

`/login` is not a route — the Login component renders in place of the app shell when the auth guard fires.
