# Feedback Mode — Design Spec
**Date:** 2026-04-21  
**Status:** Approved for implementation

---

## Context

Users need a way to report bugs, ideas, or issues from within the app. The key insight is to reuse the existing TutorTooltip infrastructure — which already wraps UI regions across the entire app — to provide contextual feedback. When a user activates "Feedback Mode", the same components that show help text in Tutor Mode instead show an orange "Report Issue" button, pre-filling the feedback form with the component's context. This gives the Developer an exact map of where in the UI the issue occurred.

Data is stored in Supabase (not SharePoint) because: (1) it's only needed by the user and Claude for analysis, (2) Claude has direct MCP SQL access to Supabase, enabling future automated Monday analysis without API proxies.

---

## Architecture

```
TutorContext
  ├── isTutorMode         (existing)
  └── isFeedbackMode      (new — mutually exclusive with isTutorMode)

TutorTooltip
  ├── isTutorMode  → purple dashed ring + help text     (existing)
  └── isFeedbackMode → orange dashed ring + "Report Issue" button
                        → navigate('/feedback/new?component=X&context=Y')

TopNav
  └── two toggle buttons: [Tutor Mode] [Feedback Mode]

Layout.tsx
  └── fallback floating "📣" button (visible only in Feedback Mode)
      → navigate('/feedback/new') with no pre-fill

/feedback/new  — submit form (all authenticated users)
/feedback      — management list (Developer only, has permission guard)

feedbackService.ts → @supabase/supabase-js direct client
```

---

## Supabase Table: `feedback`

```sql
create table feedback (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('Bug', 'Idea', 'Other')),
  title           text not null,
  description     text not null,
  priority        text not null check (priority in ('Low', 'Medium', 'High')),
  status          text not null default 'Open' check (status in ('Open', 'In Progress', 'Done')),
  component_name  text,
  component_context text,
  submitted_by    text not null,
  created_at      timestamptz not null default now()
);

-- RLS: app is protected by Cloudflare Access, treat all requests as trusted internal
alter table feedback enable row level security;
create policy "allow_insert" on feedback for insert with check (true);
create policy "allow_select" on feedback for select using (true);
create policy "allow_update" on feedback for update using (true);
```

---

## Environment Variables

Add to `.env.example` and `.env.local`:

```
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

---

## Component Details

### TutorContext (`src/contexts/TutorContext.tsx`)

New interface:
```ts
interface TutorContextType {
  isTutorMode: boolean;
  isFeedbackMode: boolean;
  toggleTutorMode: () => void;
  toggleFeedbackMode: () => void;
}
```

Mutual exclusion rule:
- `toggleTutorMode` → sets `isTutorMode = !prev`, always sets `isFeedbackMode = false`
- `toggleFeedbackMode` → sets `isFeedbackMode = !prev`, always sets `isTutorMode = false`

---

### TutorTooltip (`src/components/TutorTooltip.tsx`)

New prop:
```ts
componentName?: string  // e.g. "Customers.SearchFilter"
```

Naming convention: `PageName.SectionDescription`  
Examples: `Customers.SearchFilter`, `CustomerProfile.SpecialNotes`, `Sidebar.Navigation`

Feedback mode behaviour:
- Orange dashed ring (`ring-orange-500`) + orange background tint
- Orange bouncing icon (⚠ or `Flag` from lucide)
- On hover: shows "Report Issue" button (orange)
- On click: `navigate('/feedback/new?component=<componentName>&context=<encodeURIComponent(text)>')`
- If `componentName` is undefined: navigates to `/feedback/new` without params

When neither mode is active: renders children passthrough (existing behaviour).

---

### feedbackService (`src/services/feedbackService.ts`)

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

interface FeedbackItem { /* matches table columns */ }
interface CreateFeedbackInput { type, title, description, priority, component_name?, component_context?, submitted_by }

feedbackService.create(data: CreateFeedbackInput): Promise<void>
feedbackService.findAll(): Promise<FeedbackItem[]>
feedbackService.updateStatus(id: string, status: string): Promise<void>
```

---

### FeedbackNew page (`src/pages/FeedbackNew.tsx`)

- Accessible to all authenticated users (no permission guard)
- On mount: reads `?component` and `?context` from URL search params
- Pre-fills: Title = `[Bug in ${component}]` if component present, component_context pre-fills description area header
- Form fields: Type dropdown, Title input, Description textarea, Priority radio/select
- `submitted_by` = email from `localStorage.getItem('userEmail')`
- On submit success: toast "Feedback submitted!" → `navigate(-1)` (back to previous page)
- On submit error: inline error message

---

### Feedback page (`src/pages/Feedback.tsx`)

- Permission guard: `if (!hasPermission('Developer')) return <Navigate to="/" />`
- Table columns: Created At, Type, Priority, Status, Component, Title, Submitted By
- Status dropdown per row (inline update via `feedbackService.updateStatus`)
- Filter bar: by Type, Status, Priority
- No pagination needed initially (internal volume will be low)

---

### TopNav (`src/components/TopNav.tsx`)

Add two icon buttons next to existing controls:
- `BookOpen` icon → toggle Tutor Mode (purple when active)
- `Flag` icon → toggle Feedback Mode (orange when active)
- Visual indicator: active mode button has coloured background

---

### Sidebar (`src/components/Sidebar.tsx`)

Add to Developer-only nav items:
```ts
if (hasPermission('Developer')) {
  navItems.push({ icon: MessageSquare, label: 'Feedback', path: '/feedback' })
}
```

Also add `componentName` to existing TutorTooltip usages in Sidebar:
- Nav item tooltips: `componentName="Sidebar.Navigation"`

---

### Layout (`src/components/Layout.tsx`)

When `isFeedbackMode` is true, render a floating fallback button:
```tsx
{isFeedbackMode && (
  <button
    onClick={() => navigate('/feedback/new')}
    className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white rounded-full p-3 shadow-lg"
    title="Report an issue"
  >
    <Flag className="w-5 h-5" />
  </button>
)}
```

This covers pages with no TutorTooltip wrappers (Reports, AuditLog, OrderDetails, etc.).

---

### App.tsx (`src/App.tsx`)

Add routes:
```tsx
<Route path="/feedback" element={<Feedback />} />
<Route path="/feedback/new" element={<FeedbackNew />} />
```

---

## componentName Prop — Files to Update

All existing TutorTooltip usages need `componentName` added (mechanical change):

| File | Count | Example componentName values |
|---|---|---|
| `src/components/Sidebar.tsx` | 2 | `"Sidebar.Navigation"` |
| `src/pages/Dashboard.tsx` | 1 | `"Dashboard.StatCard"` |
| `src/pages/Customers.tsx` | 3 | `"Customers.AddButton"`, `"Customers.SearchFilter"`, `"Customers.Table"` |
| `src/pages/CustomerProfile.tsx` | 6 | `"CustomerProfile.EditButton"`, `"CustomerProfile.NewOrder"`, etc. |
| `src/pages/Settings.tsx` | 1 | `"Settings.Navigation"` |
| `src/pages/QuickLinks.tsx` | 2 | `"QuickLinks.AddButton"`, `"QuickLinks.LinkItem"` |

**Total: 15 instances** (`.codepilot-uploads/` skipped — not a real source file)

---

## Implementation Order (5 sub-tasks)

1. **Supabase setup** — install package, add env vars, create table + RLS via Supabase MCP
2. **Context + Tooltip core** — TutorContext mutual exclusion, TutorTooltip feedback mode UI
3. **Data layer + pages** — feedbackService.ts, FeedbackNew.tsx, Feedback.tsx
4. **Navigation integration** — TopNav toggles, Sidebar menu item, App.tsx routes, Layout fallback button
5. **componentName prop rollout** — add to all 15 existing TutorTooltip usages

---

## Verification

- [ ] Toggle Feedback Mode in TopNav → orange rings appear on all TutorTooltip elements
- [ ] Toggle Tutor Mode while Feedback Mode is ON → Feedback Mode turns off, Tutor Mode turns on
- [ ] Click "Report Issue" on a wrapped component → navigates to `/feedback/new` with params pre-filled
- [ ] Submit form → Supabase row inserted, toast shown, navigates back
- [ ] Visit `/feedback` as Developer → sees all submissions, can update status
- [ ] Visit `/feedback` as non-Developer → redirected to `/`
- [ ] Open Feedback Mode on Reports page (no TutorTooltip) → floating orange button visible
- [ ] Click floating button → navigates to `/feedback/new` with empty form
