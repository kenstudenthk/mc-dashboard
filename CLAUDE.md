# CLAUDE.md

## Rules

| File | Purpose |
|---|---|
| `.claude/rules/workflow.md` | Collaboration rules: approval, scope limits, bug-fix process |
| `.claude/rules/code-style.md` | Immutability, component size, TypeScript conventions |
| `.claude/rules/testing.md` | Vitest setup, TDD requirements, coverage targets |
| `.claude/rules/api-conventions.md` | Service layer pattern, API response format, Gemini usage |

## Commands

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm run lint      # TypeScript check (tsc --noEmit)
npm test          # Run Vitest tests
npm run test:coverage  # Coverage report (80% lines target)
```

## Environment

Copy `.env.example` to `.env.local`. Required vars:

```
GEMINI_API_KEY
VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_SERVICE_ROLE_KEY
VITE_API_CUSTOMERS_URL / VITE_API_ORDERS_URL / VITE_API_GET_PAGE_URL
VITE_API_ORDER_TIMELINE_URL / VITE_API_AUDIT_LOGS_URL / VITE_API_QUICK_LINKS_URL
VITE_API_PERMISSIONS_URL / VITE_API_SERVICE_ACCOUNTS_URL / VITE_API_MASTER_ACCOUNT_URL
VITE_API_ORDER_STEPS_URL / VITE_API_EMAIL_TEMPLATES_URL / VITE_API_EMAIL_URL
```

## Tech stack

React 19, TypeScript, Vite 6, Tailwind CSS v4, React Router DOM v7, Recharts, Supabase, Power Automate (SharePoint data layer), Cloudflare Pages.

## Auto-fix workflow

Label any GitHub issue `auto-fix` → `auto-fix-issue.yml` fires Claude Code action → fix loop → PR. Run `/fix-issue-log` for on-demand. See `docs/branch-protection-setup.md` for setup.

## Folder docs (lazy-loaded per folder)

| Folder | CLAUDE.md covers |
|---|---|
| `src/services/` | POST envelope, service file table, `normalizeCloudProvider` rule |
| `src/components/` | Component conventions, design tokens, TutorTooltip, comboboxes |
| `src/components/BulkImport/` | 5-step state machine, BulkImportTypes schema |
| `src/components/DataEditMode/` | DataEditTable/EditableCell/ColumnFilter API |
| `src/pages/` | Route table, `useOrdersQuery`, form patterns |
| `src/contexts/` | Provider order, role hierarchy, `hasPermission` signature |
| `src/lib/` | Supabase client, anon vs service-role key, CODEOWNERS note |
