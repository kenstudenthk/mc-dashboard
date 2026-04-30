# Feedback Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a contextual Feedback Mode to mc-dashboard that lets any user report issues by clicking orange-highlighted UI regions, with submissions stored in Supabase and a Developer-only management page.

**Architecture:** Extend TutorContext with a mutually exclusive `isFeedbackMode` state; TutorTooltip renders an orange ring + "Report Issue" button in this mode, navigating to `/feedback/new` with component context pre-filled in URL params. Data persists to Supabase via a direct JS client (not Power Automate), giving Claude MCP SQL access for future analysis.

**Tech Stack:** React 19, TypeScript, Supabase JS client (`@supabase/supabase-js`), React Router DOM v7, Lucide React, Tailwind CSS v4

**Worktree:** `.worktrees/feat/feedback-mode` on branch `feat/feedback-mode`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/contexts/TutorContext.tsx` | Add `isFeedbackMode` + mutual exclusion |
| Modify | `src/components/TutorTooltip.tsx` | Orange feedback mode ring + Report button |
| Modify | `src/components/TopNav.tsx` | Feedback Mode toggle button |
| Modify | `src/components/Sidebar.tsx` | Developer-only Feedback nav item + componentName props |
| Modify | `src/components/Layout.tsx` | Fallback floating Report button |
| Modify | `src/App.tsx` | Add `/feedback` and `/feedback/new` routes |
| Create | `src/services/feedbackService.ts` | Supabase CRUD for feedback table |
| Create | `src/pages/FeedbackNew.tsx` | Submit form (all users, URL-param pre-fill) |
| Create | `src/pages/Feedback.tsx` | Developer-only management list |
| Modify | `src/pages/Dashboard.tsx` | Add componentName to TutorTooltip |
| Modify | `src/pages/Customers.tsx` | Add componentName to 3 TutorTooltips |
| Modify | `src/pages/CustomerProfile.tsx` | Add componentName to 6 TutorTooltips |
| Modify | `src/pages/Settings.tsx` | Add componentName to TutorTooltip |
| Modify | `src/pages/QuickLinks.tsx` | Add componentName to 2 TutorTooltips |
| Modify | `.env.example` | Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY |

---

## Task 1: Supabase table + package install

**Files:**
- Modify: `.env.example`
- Modify: `.worktrees/feat/feedback-mode/package.json` (via npm install)

- [ ] **Step 1: List existing Supabase projects via MCP**

Use `mcp__claude_ai_Supabase__list_projects` to find an existing project to reuse, or `mcp__claude_ai_Supabase__create_project` if none exists. Note the project ref (e.g. `abcdefghijklm`).

- [ ] **Step 2: Get project URL and anon key**

Use `mcp__claude_ai_Supabase__get_project_url` and `mcp__claude_ai_Supabase__get_publishable_keys` with the project ref to retrieve `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values.

- [ ] **Step 3: Create the feedback table via MCP**

Use `mcp__claude_ai_Supabase__execute_sql` with this SQL:

```sql
create table if not exists feedback (
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

alter table feedback enable row level security;

create policy "allow_insert" on feedback for insert with check (true);
create policy "allow_select" on feedback for select using (true);
create policy "allow_update" on feedback for update using (true);
```

- [ ] **Step 4: Add env vars to .env.example**

In `C:/Users/user/Desktop/GitHub/mc-dashboard/.env.example`, add after the last line:

```
# Supabase (used by src/services/feedbackService.ts)
VITE_SUPABASE_URL="your-supabase-project-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

- [ ] **Step 5: Create .env.local with real values**

Create `.env.local` in the worktree root (copy from `.env.local` in the main repo if it exists, then append):

```
VITE_SUPABASE_URL=<value from Step 2>
VITE_SUPABASE_ANON_KEY=<value from Step 2>
```

- [ ] **Step 6: Install @supabase/supabase-js in the worktree**

```bash
cd ".worktrees/feat/feedback-mode" && npm install @supabase/supabase-js
```

Expected: package added to `package.json` + `package-lock.json` updated.

- [ ] **Step 7: Verify build still passes**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: `built in Xs` with no errors.

- [ ] **Step 8: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add .env.example package.json package-lock.json && git commit -m "feat: add Supabase feedback table and install supabase-js"
```

---

## Task 2: TutorContext — add isFeedbackMode with mutual exclusion

**Files:**
- Modify: `src/contexts/TutorContext.tsx`

- [ ] **Step 1: Replace the full file content**

Replace `src/contexts/TutorContext.tsx` with:

```tsx
import React, { createContext, useContext, useState } from 'react';

interface TutorContextType {
  isTutorMode: boolean;
  isFeedbackMode: boolean;
  toggleTutorMode: () => void;
  toggleFeedbackMode: () => void;
}

const TutorContext = createContext<TutorContextType | undefined>(undefined);

export const TutorProvider = ({ children }: { children: React.ReactNode }) => {
  const [isTutorMode, setIsTutorMode] = useState(false);
  const [isFeedbackMode, setIsFeedbackMode] = useState(false);

  const toggleTutorMode = () => {
    setIsTutorMode(prev => !prev);
    setIsFeedbackMode(false);
  };

  const toggleFeedbackMode = () => {
    setIsFeedbackMode(prev => !prev);
    setIsTutorMode(false);
  };

  return (
    <TutorContext.Provider value={{ isTutorMode, isFeedbackMode, toggleTutorMode, toggleFeedbackMode }}>
      {children}
    </TutorContext.Provider>
  );
};

export const useTutor = () => {
  const context = useContext(TutorContext);
  if (!context) {
    throw new Error('useTutor must be used within a TutorProvider');
  }
  return context;
};
```

- [ ] **Step 2: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/contexts/TutorContext.tsx && git commit -m "feat: add isFeedbackMode to TutorContext with mutual exclusion"
```

---

## Task 3: TutorTooltip — add feedback mode UI

**Files:**
- Modify: `src/components/TutorTooltip.tsx`

- [ ] **Step 1: Replace the full file content**

Replace `src/components/TutorTooltip.tsx` with:

```tsx
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTutor } from "../contexts/TutorContext";
import { HelpCircle, Flag } from "lucide-react";

interface TutorTooltipProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "bottom" | "left" | "right";
  wrapperClass?: string;
  componentName?: string;
}

export const TutorTooltip: React.FC<TutorTooltipProps> = ({
  children,
  text,
  position = "top",
  wrapperClass = "w-full",
  componentName,
}) => {
  const { isTutorMode, isFeedbackMode } = useTutor();
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  if (!isTutorMode && !isFeedbackMode) {
    return <>{children}</>;
  }

  const getTooltipStyle = (): React.CSSProperties => {
    if (!wrapperRef.current) return { display: "none" };
    const rect = wrapperRef.current.getBoundingClientRect();
    const gap = 12;
    const tooltipWidth = 256;

    switch (position) {
      case "right":
        return { position: "fixed", top: rect.top + rect.height / 2, left: rect.right + gap, transform: "translateY(-50%)", width: tooltipWidth };
      case "left":
        return { position: "fixed", top: rect.top + rect.height / 2, left: rect.left - gap - tooltipWidth, transform: "translateY(-50%)", width: tooltipWidth };
      case "bottom":
        return { position: "fixed", top: rect.bottom + gap, left: rect.left + rect.width / 2, transform: "translateX(-50%)", width: tooltipWidth };
      case "top":
      default:
        return { position: "fixed", top: rect.top - gap, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)", width: tooltipWidth };
    }
  };

  const arrowClass = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2",
    left: "right-[-6px] top-1/2 -translate-y-1/2",
    right: "left-[-6px] top-1/2 -translate-y-1/2",
  };

  const handleReport = () => {
    const params = new URLSearchParams();
    if (componentName) params.set("component", componentName);
    if (text) params.set("context", encodeURIComponent(text));
    navigate(`/feedback/new?${params.toString()}`);
  };

  if (isFeedbackMode) {
    return (
      <div
        ref={wrapperRef}
        className={`relative ${wrapperClass}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative z-0 ring-2 ring-orange-500 ring-dashed rounded-lg transition-all duration-300 bg-orange-50/20">
          {children}
          <button
            onClick={handleReport}
            className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg z-20 animate-bounce cursor-pointer hover:bg-orange-600 transition-colors"
            aria-label="Report issue with this component"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {isHovered &&
          ReactDOM.createPortal(
            <div
              style={{ ...getTooltipStyle(), zIndex: 9999 }}
              className="p-3 bg-orange-900 text-white text-sm rounded-xl shadow-2xl"
            >
              <div className="font-bold text-orange-300 mb-1 text-xs uppercase tracking-wider">
                Report Issue
              </div>
              {componentName && (
                <div className="text-orange-200 text-xs mb-2 font-mono">{componentName}</div>
              )}
              <button
                onClick={handleReport}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white text-xs py-1.5 px-3 rounded-lg font-medium transition-colors"
              >
                Report Issue Here →
              </button>
              <div className={`absolute w-3 h-3 bg-orange-900 transform rotate-45 ${arrowClass[position]}`} />
            </div>,
            document.body,
          )}
      </div>
    );
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative ${wrapperClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative z-0 ring-2 ring-purple-500 ring-dashed rounded-lg transition-all duration-300 bg-purple-50/20">
        {children}
        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg z-20 animate-bounce cursor-help">
          <HelpCircle className="w-4 h-4" />
        </div>
      </div>

      {isHovered &&
        ReactDOM.createPortal(
          <div
            style={{ ...getTooltipStyle(), zIndex: 9999 }}
            className="p-3 bg-purple-900 text-white text-sm rounded-xl shadow-2xl pointer-events-none"
          >
            <div className="font-bold text-purple-300 mb-1 text-xs uppercase tracking-wider">
              Guideline
            </div>
            <div className="leading-relaxed">{text}</div>
            <div className={`absolute w-3 h-3 bg-purple-900 transform rotate-45 ${arrowClass[position]}`} />
          </div>,
          document.body,
        )}
    </div>
  );
};
```

- [ ] **Step 2: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/components/TutorTooltip.tsx && git commit -m "feat: add feedback mode to TutorTooltip with orange ring and Report button"
```

---

## Task 4: feedbackService.ts

**Files:**
- Create: `src/services/feedbackService.ts`

- [ ] **Step 1: Create the service file**

Create `src/services/feedbackService.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

export interface FeedbackItem {
  id: string;
  type: 'Bug' | 'Idea' | 'Other';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Done';
  component_name: string | null;
  component_context: string | null;
  submitted_by: string;
  created_at: string;
}

export interface CreateFeedbackInput {
  type: 'Bug' | 'Idea' | 'Other';
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  component_name?: string;
  component_context?: string;
  submitted_by: string;
}

export const feedbackService = {
  async create(data: CreateFeedbackInput): Promise<void> {
    const { error } = await supabase.from('feedback').insert(data);
    if (error) throw new Error(error.message);
  },

  async findAll(): Promise<FeedbackItem[]> {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async updateStatus(id: string, status: FeedbackItem['status']): Promise<void> {
    const { error } = await supabase
      .from('feedback')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
```

- [ ] **Step 2: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/services/feedbackService.ts && git commit -m "feat: add feedbackService with Supabase direct client"
```

---

## Task 5: FeedbackNew.tsx — submit form

**Files:**
- Create: `src/pages/FeedbackNew.tsx`

- [ ] **Step 1: Create the page**

Create `src/pages/FeedbackNew.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';
import { feedbackService, CreateFeedbackInput } from '../services/feedbackService';
import { Flag, CheckCircle } from 'lucide-react';

const FeedbackNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userEmail } = usePermission();

  const componentName = searchParams.get('component') ?? '';
  const contextText = searchParams.get('context') ? decodeURIComponent(searchParams.get('context')!) : '';

  const [form, setForm] = useState<Omit<CreateFeedbackInput, 'submitted_by'>>({
    type: 'Bug',
    title: componentName ? `[Issue] ${componentName}` : '',
    description: contextText ? `Context: ${contextText}\n\n` : '',
    priority: 'Medium',
    component_name: componentName || undefined,
    component_context: contextText || undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await feedbackService.create({
        ...form,
        submitted_by: userEmail ?? 'unknown',
      });
      setSuccess(true);
      setTimeout(() => navigate(-1), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <p className="text-lg font-semibold text-[#1d1d1f]">Feedback submitted!</p>
        <p className="text-sm text-[#1d1d1f]/50">Returning to previous page…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Flag className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#1d1d1f]">Report Feedback</h1>
          {componentName && (
            <p className="text-xs text-[#1d1d1f]/50 font-mono mt-0.5">{componentName}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-5">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="label-text block mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => handleChange('type', e.target.value)}
              className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25"
            >
              <option value="Bug">Bug</option>
              <option value="Idea">Idea</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label-text block mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={e => handleChange('priority', e.target.value)}
              className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label-text block mb-1.5">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="One-line summary of the issue or idea"
            className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25"
          />
        </div>

        <div>
          <label className="label-text block mb-1.5">Description</label>
          <textarea
            required
            rows={6}
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Describe the issue or idea in detail…"
            className="w-full px-3 py-2 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0071e3]/25 resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-[#1d1d1f]/60 hover:text-[#1d1d1f] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="gradient-cta px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-opacity"
          >
            {submitting ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackNew;
```

- [ ] **Step 2: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/pages/FeedbackNew.tsx && git commit -m "feat: add FeedbackNew page with pre-fill from URL params"
```

---

## Task 6: Feedback.tsx — Developer management list

**Files:**
- Create: `src/pages/Feedback.tsx`

- [ ] **Step 1: Create the page**

Create `src/pages/Feedback.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../contexts/PermissionContext';
import { feedbackService, FeedbackItem } from '../services/feedbackService';
import { Flag, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<FeedbackItem['status'], string> = {
  'Open': 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  'Done': 'bg-green-100 text-green-700',
};

const PRIORITY_COLORS: Record<FeedbackItem['priority'], string> = {
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-orange-100 text-orange-700',
  'High': 'bg-red-100 text-red-700',
};

const TYPE_COLORS: Record<FeedbackItem['type'], string> = {
  'Bug': 'bg-red-100 text-red-700',
  'Idea': 'bg-purple-100 text-purple-700',
  'Other': 'bg-gray-100 text-gray-600',
};

const Feedback = () => {
  const { hasPermission } = usePermission();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  if (!hasPermission('Developer')) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    feedbackService.findAll()
      .then(setItems)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id: string, status: FeedbackItem['status']) => {
    try {
      await feedbackService.updateStatus(id, status);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filtered = items.filter(item =>
    (typeFilter === 'All' || item.type === typeFilter) &&
    (statusFilter === 'All' || item.status === statusFilter)
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
          <Flag className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#1d1d1f]">Feedback</h1>
          <p className="text-sm text-[#1d1d1f]/50">{items.length} submission{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#1d1d1f]/08 flex gap-3 flex-wrap">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-xs focus:outline-none"
          >
            <option value="All">All Types</option>
            <option value="Bug">Bug</option>
            <option value="Idea">Idea</option>
            <option value="Other">Other</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#f5f5f7] border border-[#1d1d1f]/10 rounded-lg text-xs focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        {loading && (
          <div className="p-8 text-center text-sm text-[#1d1d1f]/40">Loading feedback…</div>
        )}

        {error && (
          <div className="p-4 flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-[#1d1d1f]/40">No feedback found.</div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1d1d1f]/08">
                  <th className="text-left px-4 py-3 label-text">Date</th>
                  <th className="text-left px-4 py-3 label-text">Type</th>
                  <th className="text-left px-4 py-3 label-text">Priority</th>
                  <th className="text-left px-4 py-3 label-text">Component</th>
                  <th className="text-left px-4 py-3 label-text">Title</th>
                  <th className="text-left px-4 py-3 label-text">By</th>
                  <th className="text-left px-4 py-3 label-text">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-[#1d1d1f]/05 hover:bg-[#f5f5f7]/60 transition-colors">
                    <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[item.type]}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs font-mono">
                      {item.component_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1d1d1f] max-w-xs">
                      <div className="truncate" title={item.title}>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-[#1d1d1f]/40 truncate mt-0.5">{item.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#1d1d1f]/50 text-xs">{item.submitted_by}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as FeedbackItem['status'])}
                        className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer focus:outline-none ${STATUS_COLORS[item.status]}`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feedback;
```

- [ ] **Step 2: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/pages/Feedback.tsx && git commit -m "feat: add Feedback management page (Developer only)"
```

---

## Task 7: Navigation integration

**Files:**
- Modify: `src/components/TopNav.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Update TopNav — add Feedback Mode toggle**

In `src/components/TopNav.tsx`:

Change line 21 (destructure useTutor):
```tsx
const { isTutorMode, toggleTutorMode, isFeedbackMode, toggleFeedbackMode } = useTutor();
```

Add `Flag` to the lucide-react import on line 2:
```tsx
import { Search, Bell, ChevronRight, Shield, GraduationCap, Menu, Flag } from "lucide-react";
```

After the Tutor Mode button (after line 88, before the Developer role select), add:
```tsx
        <button
          onClick={toggleFeedbackMode}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
            isFeedbackMode
              ? "bg-orange-100 text-orange-700 border-orange-200"
              : "bg-[#f5f5f7] text-[#1d1d1f]/60 border-[#1d1d1f]/10 hover:bg-[#ededf2]"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          {isFeedbackMode ? "Report: ON" : "Report: OFF"}
        </button>
```

- [ ] **Step 2: Update Sidebar — add Feedback nav item**

In `src/components/Sidebar.tsx`, find the import line for lucide-react icons and add `MessageSquare` to it.

Find the section that adds Admin-only items (where `hasPermission('Admin')` is checked). After the existing Admin-only block, add a Developer-only block:

```tsx
if (hasPermission('Developer')) {
  navItems.push({ icon: MessageSquare, label: 'Feedback', path: '/feedback' });
}
```

Also update the two existing TutorTooltip usages in Sidebar.tsx — add `componentName="Sidebar.Navigation"` to both:
```tsx
<TutorTooltip text={`Navigate to the ${item.label} page.`} componentName="Sidebar.Navigation">
```
and
```tsx
<TutorTooltip text={`Navigate to ${item.label}.`} componentName="Sidebar.Navigation">
```

- [ ] **Step 3: Update Layout — add fallback floating button**

In `src/components/Layout.tsx`:

Add imports at top:
```tsx
import { useNavigate } from 'react-router-dom';
import { useTutor } from '../contexts/TutorContext';
import { Flag } from 'lucide-react';
```

Inside the `Layout` component, add:
```tsx
  const navigate = useNavigate();
  const { isFeedbackMode } = useTutor();
```

Before the closing `</div>` of the root element, add the fallback floating button:
```tsx
      {isFeedbackMode && (
        <button
          onClick={() => navigate('/feedback/new')}
          className="fixed bottom-6 right-6 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3.5 shadow-xl transition-colors"
          title="Report an issue on this page"
          aria-label="Report an issue"
        >
          <Flag className="w-5 h-5" />
        </button>
      )}
```

- [ ] **Step 4: Update App.tsx — add routes**

In `src/App.tsx`, add imports:
```tsx
import Feedback from './pages/Feedback';
import FeedbackNew from './pages/FeedbackNew';
```

Inside the `<Routes>` block, add before the closing `</Routes>`:
```tsx
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/feedback/new" element={<FeedbackNew />} />
```

- [ ] **Step 5: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/components/TopNav.tsx src/components/Sidebar.tsx src/components/Layout.tsx src/App.tsx && git commit -m "feat: wire Feedback Mode into navigation — TopNav toggle, Sidebar menu, routes, fallback button"
```

---

## Task 8: componentName prop rollout

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Customers.tsx`
- Modify: `src/pages/CustomerProfile.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/QuickLinks.tsx`

- [ ] **Step 1: Dashboard.tsx — 1 instance**

Find: `<TutorTooltip` with `text={stat.tooltip}` (line ~144)

Add prop: `componentName="Dashboard.StatCard"`

- [ ] **Step 2: Customers.tsx — 3 instances**

Find and update each TutorTooltip:

- `text="Click here to add a new customer..."` → add `componentName="Customers.AddButton"`
- `text="Search for a customer by their name..."` → add `componentName="Customers.SearchFilter"`
- `text="Click the customer name to view..."` → add `componentName="Customers.Table"`

- [ ] **Step 3: CustomerProfile.tsx — 6 instances**

Find and update each TutorTooltip:

- `text="Click here to edit the customer's contact information."` → add `componentName="CustomerProfile.EditButton"`
- `text="Quickly start a new order specifically for this customer."` → add `componentName="CustomerProfile.NewOrderButton"`
- `text="Total number of orders placed by this customer."` → add `componentName="CustomerProfile.TotalOrders"`
- `text="Total amount spent by this customer across all orders."` → add `componentName="CustomerProfile.TotalSpent"`
- `text="Use this section to store important, customer-specific information..."` → add `componentName="CustomerProfile.SpecialNotes"`
- `text="Orders are grouped by project name..."` → add `componentName="CustomerProfile.OrdersTable"`

- [ ] **Step 4: Settings.tsx — 1 instance**

Find: `text="Navigate between different settings categories..."` → add `componentName="Settings.Navigation"`

- [ ] **Step 5: QuickLinks.tsx — 2 instances**

- `text="Global Admins and Developers can add new quick links here."` → add `componentName="QuickLinks.AddButton"`
- `text={`Click here to open the ${link.Title} in a new tab.`}` → add `componentName="QuickLinks.LinkItem"`

- [ ] **Step 6: Verify build**

```bash
cd ".worktrees/feat/feedback-mode" && npm run build 2>&1 | tail -5
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
cd ".worktrees/feat/feedback-mode" && git add src/pages/Dashboard.tsx src/pages/Customers.tsx src/pages/CustomerProfile.tsx src/pages/Settings.tsx src/pages/QuickLinks.tsx && git commit -m "feat: add componentName prop to all 15 TutorTooltip instances"
```

---

## Verification Checklist

- [ ] Start dev server: `cd ".worktrees/feat/feedback-mode" && npm run dev`
- [ ] Click "Report: OFF" in TopNav → turns orange, "Report: ON"; orange dashed rings appear on wrapped components
- [ ] While Report Mode ON, click "Tutor: OFF" → Report Mode turns OFF, Tutor Mode turns ON (purple)
- [ ] Hover an orange ring → see "Report Issue Here →" button with componentName shown
- [ ] Click "Report Issue Here →" → navigates to `/feedback/new` with Title and Description pre-filled
- [ ] Submit the form → green success screen → returns to previous page
- [ ] As Developer: `/feedback` page loads with the submitted item in the table
- [ ] As non-Developer (switch role in TopNav): `/feedback` redirects to `/`
- [ ] Open Feedback Mode on `/reports` (no TutorTooltip coverage) → orange floating button appears bottom-right
- [ ] Click floating button → `/feedback/new` opens with empty form
- [ ] Developer changes status from "Open" to "Done" in the feedback table → updates immediately
