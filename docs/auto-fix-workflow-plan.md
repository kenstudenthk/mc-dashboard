# Auto-Fix Issue-Log Workflow + Context-Control Restructure

## Context (why)

Build a **complete, fully-autonomous auto-fix workflow** for mc-dashboard and restructure
`.claude/` + `CLAUDE.md` so agents only load docs relevant to the folder they're working in.

Today the repo has no CI automation for code-fixing, no test framework, a single giant
root `CLAUDE.md`, and the existing `agents-orchestrator.md` is a generic template.
This plan wires everything end-to-end.

**User choices confirmed:**
- Run mode: **Both** — GitHub Action + on-demand `/fix-issue-log` command
- Issue sources: **GitHub Issues (labeled)** + **CI/build failures** + **Runtime/app error logs**
- Test gate: **Set up Vitest** now
- Always requires human approval: auth/permissions/security · DB/env/secrets · deps/build/CI · large (>3 files)

---

## Deliverables at a glance

| # | Deliverable | Path |
|---|---|---|
| 1 | Vitest setup + 3 seed tests | `package.json`, `vitest.config.ts`, `src/__tests__/` |
| 2 | `auto-fix-orchestrator` agent (tailored) | `.claude/agents/auto-fix-orchestrator.md` |
| 3 | `issue-risk-classifier` agent (lightweight) | `.claude/agents/issue-risk-classifier.md` |
| 4 | `/fix-issue-log` command | `.claude/commands/fix-issue-log.md` |
| 5 | `fix-issue-log` skill (checklist) | `.claude/skills/fix-issue-log/SKILL.md` |
| 6 | `/list-runs` command (audit query) | `.claude/commands/list-runs.md` |
| 7 | Audit logging hook + script | `.claude/hooks/audit-log.sh`, updated `settings.json` |
| 8 | GitHub Action: issue trigger | `.github/workflows/auto-fix-issue.yml` |
| 9 | GitHub Action: CI self-heal | `.github/workflows/auto-fix-ci.yml` |
| 10 | `.gitignore` update | `.gitignore` |
| 11 | Slimmed root `CLAUDE.md` (menu, ≤80 lines) | `CLAUDE.md` |
| 12 | Per-folder `CLAUDE.md` files (7) | `src/services/`, `src/components/`, `src/components/BulkImport/`, `src/components/DataEditMode/`, `src/pages/`, `src/contexts/`, `src/lib/` |
| 13 | CODEOWNERS + branch-protection doc | `.github/CODEOWNERS`, `docs/branch-protection-setup.md` |
| 14 | Issue template + PR template | `.github/ISSUE_TEMPLATE/bug-auto-fix.yml`, `.github/pull_request_template.md` |

---

## Part 1: Vitest setup (Task A — 5 files)

### `package.json` — add scripts and devDependencies

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
"devDependencies": {
  "vitest": "^2.x",
  "@testing-library/react": "^16.x",
  "@testing-library/user-event": "^14.x",
  "@testing-library/jest-dom": "^6.x",
  "jsdom": "^25.x",
  "@vitest/coverage-v8": "^2.x"
}
```

### `vitest.config.ts` (new)
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: { provider: 'v8', thresholds: { lines: 80 } },
  },
});
```

### `src/__tests__/setup.ts` (new)
```ts
import '@testing-library/jest-dom';
```

### Seed tests (create `src/__tests__/` directory):

1. **`PermissionContext.test.tsx`** — `hasPermission` hierarchy: User(1) cannot access Admin(2) gate; Developer(4) can access all.
2. **`TutorTooltip.test.tsx`** — renders children passthrough with no ring/icon when tutor mode is OFF.
3. **`normalizeCloudProvider.test.ts`** — normalizeCloudProvider("AWS (Amazon Web Service)") → "AWS", etc. Function is in `src/services/emailTemplateService.ts` (exported from there), not in constants.

---

## Part 2: Workflow policy

### Pass standard (ALL must be green)
1. `npm run lint` — zero TypeScript errors (`tsc --noEmit`)
2. `npm run build` — zero build errors
3. `npm test` — all tests pass (if bug fix: new failing test written first per TDD rule)
4. **Code Reviewer agent** returns verdict string containing `"PASS"` on its last line
5. **Security Auditor agent** returns `"PASS"` or `"N/A"` — skipped if no files in `RISK_PATHS` were changed (classifier's `required_reviewers` array does not include `"security-auditor"`)

> **Agent verdict protocol:** Orchestrator explicitly instructs each review agent: "End your response with a single line: `VERDICT: PASS` or `VERDICT: FAIL – <reason>`". Orchestrator parses the last line to determine gate result.

### Fail standard
- Any gate RED after fix attempt → increment retry counter.
- retry < 3: loop back to fixer with the exact gate failure message.
- retry ≥ 3: open PR as **draft**, add label `needs-human-review`, post comment with full per-gate diagnosis, stop the loop.

### Max loops
- **Default = 3** (constant in orchestrator + `MAX_FIX_LOOPS` env var in GitHub Action).
- User can override via `workflow_dispatch` input `max_loops`.

### Review quorum

| Condition | Agents required |
|---|---|
| Always | Code Reviewer |
| Any changed file in `RISK_PATHS` | + Security Auditor |
| Any test file changed or added | + Test Results Analyzer |
| All must emit `VERDICT: PASS` | to proceed |

### Risk routing (human approval gating)

**Auto-merge eligible** — CI green + Code Reviewer PASS sufficient:
- Bug fix touching ≤ 3 non-sensitive files
- CSS/styling, copy/display-only, non-security utility helpers

**Always requires human approval** (classifier sets `auto_merge_eligible: false`):
```
RISK_PATHS = [
  "src/contexts/PermissionContext.tsx",
  "src/services/authService.ts",
  "src/services/permissionService.ts",
  "src/lib/supabase.ts",
  ".env*", ".github/workflows/**",
  "package.json", "vite.config.ts", "tsconfig.json"
]
```
Also triggered by: changed file count > 3 OR total line diff > 200.

**Auto-merge mechanism:** For low-risk PRs the orchestrator calls `mcp__github__enable_pr_auto_merge` after creating the PR. GitHub then merges automatically once all required status checks pass. (Requires "Allow auto-merge" enabled in repo settings — documented in `branch-protection-setup.md`.)

### Rollback strategy
If an auto-merged fix breaks the deploy (Cloudflare Pages deploy fails after merge), the `auto-fix-ci.yml` action fires again on the new failure, creates a revert PR, and labels it `auto-revert`. The user is notified via a GitHub issue comment on the original issue.

### Flaky test policy
If `npm test` fails on attempt ≥ 2 with the same test name but different assertion output (indicating flakiness), the orchestrator notes this in the PR comment as "potentially flaky test — not counted as gate failure" and proceeds. A second identical test failure is counted normally.

---

## Part 3: Issue intake — all 3 sources

### Source 1: GitHub Issues (labeled `auto-fix`)
- Intake: read `github.event.issue.body` + `github.event.issue.title` in the Action; in-session command uses `mcp__github__issue_read` to fetch the issue.
- The orchestrator asks: grep the repo for the error string or component name mentioned in the issue body to locate affected files.

### Source 2: CI / build failures
- Intake: `auto-fix-ci.yml` triggers on `workflow_run` completion with `conclusion == 'failure'`.
- The orchestrator runs `npm run lint 2>&1` and `npm run build 2>&1` to capture the current error output (not the historic CI log), then parses TypeScript/Vite error messages to identify failing file(s) and line numbers.

### Source 3: Runtime / app error logs
- **Default log path:** `logs/app.jsonl` (created at runtime; add `logs/` to `.gitignore`).
- **Format:** one JSON object per line: `{ "timestamp": "ISO8601", "level": "error", "message": "...", "stack": "...", "component": "...", "url": "..." }`.
- **Read mechanism:** Orchestrator uses `Read` tool on the file (respects 2000-line limit); if file is large, reads last 100 lines via `Bash(tail -n 100 logs/app.jsonl)`.
- **In-session invocation:** `/fix-issue-log log:logs/app.jsonl` — or any path the user specifies.
- **Analysis:** orchestrator extracts `message` + `stack`, greps the repo for the function/component names in the stack trace to find affected files.

---

## Part 4: Analysis step (orchestrator Phase 1b)

After fetching the issue/failure, before assigning a fixer, the orchestrator performs a structured **root-cause analysis**:

1. Extract key terms: error message, component name, file path if mentioned, function name from stack trace.
2. `Bash(grep -r "<key_term>" src/ --include="*.ts" --include="*.tsx" -l)` to find candidate files.
3. `Read` the top 2–3 candidate files to confirm the site of the bug.
4. Output a structured analysis block:
   ```
   ANALYSIS:
   - Root cause hypothesis: <one sentence>
   - Affected file(s): <list>
   - Entry point for fix: <file:line>
   - Risk level: <low|medium|high> (from classifier)
   ```
5. Pass this analysis block to the fixer agent as its starting context.

This step uses `allowed-tools: Bash, Read` (read-only — no writes during analysis).

---

## Part 5: `.claude/` files (Task B+C — 7 files)

### `.claude/agents/auto-fix-orchestrator.md`

```yaml
---
name: Auto Fix Orchestrator
description: >
  Autonomous issue-to-PR pipeline for mc-dashboard. Ingests GitHub issues,
  CI failures, or runtime log errors; diagnoses root cause; loops fix→gate
  up to MAX_LOOPS times; opens a PR with full audit trail.
model: claude-opus-4-5
tools: Bash, Read, Write, Edit, mcp__github__issue_read, mcp__github__create_pull_request,
       mcp__github__update_pull_request, mcp__github__add_issue_comment,
       mcp__github__enable_pr_auto_merge
---
```

Phase sequence (encoded in the agent body):
- **Phase 0:** Detect intake source (issue / ci / log) and fetch raw content.
- **Phase 1 (Analysis):** Root-cause analysis as described in Part 4.
- **Phase 1b:** Spawn `issue-risk-classifier` — receive JSON verdict.
- **Phase 2:** Assign fixer: Frontend Developer if UI/TSX; Backend Architect if service/API; general-purpose otherwise.
- **Phase 3 (Loop, max `MAX_FIX_LOOPS`):**
  - Write failing test (if bug fix and test framework is configured).
  - Run fix.
  - Run gates: `npm run lint`, `npm run build`, `npm test`.
  - Spawn Code Reviewer with diff → collect `VERDICT:` line.
  - If RISK_PATHS touched: spawn Security Auditor → collect `VERDICT:` line.
  - If all PASS → advance to Phase 4.
  - If any FAIL → increment counter, loop with failure reason.
  - If counter = MAX → Phase 4 with `draft=true`.
- **Phase 4 (PR):**
  - Open PR (draft if risk=high or loops exhausted; ready otherwise).
  - If `auto_merge_eligible`: call `enable_pr_auto_merge`.
  - Post audit comment (table of per-gate verdicts + agent names + loop count).
  - Write run-log JSON to `run-logs/fix-<source>-<timestamp>.jsonl`.

### `.claude/agents/issue-risk-classifier.md`

```yaml
---
name: Issue Risk Classifier
description: >
  Lightweight read-only classifier. Given a list of changed files and a diff
  summary, returns a JSON risk verdict used by the auto-fix orchestrator for
  routing decisions.
model: claude-haiku-4-5
tools: Read
---
```

Output contract (always last block in response):
```json
{
  "risk_level": "low|medium|high",
  "auto_merge_eligible": true|false,
  "required_reviewers": ["code-reviewer"],
  "reason": "one sentence"
}
```
Contains RISK_PATHS list and the ≤ 3 files / ≤ 200 LOC heuristics.

### `.claude/commands/fix-issue-log.md`

```yaml
---
description: "Full auto-fix pipeline: fetch issue or CI failure or log, analyze, loop-fix, gate, open PR"
argument-hint: "<issue-number> | ci | log:<path>"
allowed-tools: Bash, Read, Write, Edit, mcp__github__issue_read,
               mcp__github__create_pull_request, mcp__github__add_issue_comment,
               mcp__github__enable_pr_auto_merge
model: claude-opus-4-5
---
```

Body: parse argument → spawn `auto-fix-orchestrator` with full context → report PR URL + audit summary.

### `.claude/commands/list-runs.md` (traceability query interface)

```yaml
---
description: "List and inspect past auto-fix runs from run-logs/"
argument-hint: "[issue-number | last | all]"
allowed-tools: Bash, Read
model: claude-haiku-4-5
---
```

Body: reads `run-logs/` directory → lists runs sorted by timestamp → if argument given, `Read` that run's JSONL and format as a readable table showing: issue/source, loop count, gates passed/failed, PR URL, final status, agent verdicts. The user can run `/list-runs last` to see the most recent run in full.

### `.claude/skills/fix-issue-log/SKILL.md`

Checklist:
```
- [ ] Issue/failure fetched and understood
- [ ] Root-cause analysis done (affected files identified)
- [ ] Risk classification done (auto_merge_eligible set)
- [ ] Failing test written (or N/A with reason)
- [ ] Implementation attempt(s) made (≤ MAX_LOOPS)
- [ ] lint PASS
- [ ] build PASS
- [ ] test PASS
- [ ] code-review VERDICT: PASS
- [ ] security-review VERDICT: PASS or N/A
- [ ] Run-log written to run-logs/
- [ ] PR opened (draft if high-risk or loops exhausted; ready if clean)
- [ ] enable_pr_auto_merge called (if auto_merge_eligible)
- [ ] Audit comment posted on PR with per-gate verdicts
```

### `.claude/hooks/audit-log.sh` (new)

```bash
#!/bin/bash
# Hook variables per Claude Code docs:
# CLAUDE_HOOK_EVENT, CLAUDE_TOOL_NAME, CLAUDE_SESSION_ID, CLAUDE_WORKING_DIR
mkdir -p run-logs
echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"event\":\"${CLAUDE_HOOK_EVENT}\",\"tool\":\"${CLAUDE_TOOL_NAME}\",\"session\":\"${CLAUDE_SESSION_ID}\",\"cwd\":\"${CLAUDE_WORKING_DIR}\"}" \
  >> run-logs/session-audit.jsonl
exit 0
```

### `.claude/settings.json` (updated)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run lint*)",
      "Bash(npm run build)",
      "Bash(npm test)",
      "Bash(npm run test*)",
      "Bash(npm ci)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git show*)",
      "Bash(grep -r*)",
      "Bash(tail -n*)",
      "Bash(mkdir -p run-logs)",
      "Bash(echo * >> run-logs/*)",
      "mcp__github__pull_request_read",
      "mcp__github__issue_read",
      "mcp__github__list_issues",
      "mcp__github__add_issue_comment",
      "mcp__github__create_pull_request",
      "mcp__github__update_pull_request",
      "mcp__github__enable_pr_auto_merge"
    ]
  },
  "hooks": {
    "PostToolUse": [{ "command": "bash .claude/hooks/audit-log.sh" }],
    "SubagentStop": [{ "command": "bash .claude/hooks/audit-log.sh" }]
  }
}
```

> **Context control — how it actually works:** Claude Code loads `CLAUDE.md` files from the
> repo root up through the current working directory only. There is no settings toggle needed.
> By keeping the root `CLAUDE.md` short (≤80 lines) and moving detail into per-folder files,
> an agent working in `src/services/` loads only: root `CLAUDE.md` + `src/services/CLAUDE.md`.
> It does NOT load `src/components/CLAUDE.md`, `src/pages/CLAUDE.md`, etc. This is the
> native lazy-loading mechanism — no `settings.json` change required for context reduction.

---

## Part 6: GitHub Actions (Task D — 2 files)

### `.github/workflows/auto-fix-issue.yml`

```yaml
name: Auto Fix Issue
on:
  issues:
    types: [labeled]
  workflow_dispatch:
    inputs:
      issue_number: { required: true, type: number, description: "Issue number to fix" }
      max_loops:    { default: "3",   type: string,  description: "Max fix attempts" }

jobs:
  auto-fix:
    if: github.event.label.name == 'auto-fix' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "/fix-issue-log ${{ github.event.issue.number || inputs.issue_number }}"
          system_prompt: "MAX_FIX_LOOPS=${{ inputs.max_loops || '3' }}"
          allowed_tools: "Bash,Read,Write,Edit,mcp__github__issue_read,mcp__github__create_pull_request,mcp__github__update_pull_request,mcp__github__add_issue_comment,mcp__github__enable_pr_auto_merge"
        env:
          VITE_SUPABASE_URL:              ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY:         ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_API_ORDERS_URL:            ${{ secrets.VITE_API_ORDERS_URL }}
          VITE_API_CUSTOMERS_URL:         ${{ secrets.VITE_API_CUSTOMERS_URL }}
          VITE_API_GET_PAGE_URL:          ${{ secrets.VITE_API_GET_PAGE_URL }}
          VITE_API_ORDER_TIMELINE_URL:    ${{ secrets.VITE_API_ORDER_TIMELINE_URL }}
          VITE_API_AUDIT_LOGS_URL:        ${{ secrets.VITE_API_AUDIT_LOGS_URL }}
          VITE_API_QUICK_LINKS_URL:       ${{ secrets.VITE_API_QUICK_LINKS_URL }}
          VITE_API_PERMISSIONS_URL:       ${{ secrets.VITE_API_PERMISSIONS_URL }}
          VITE_API_SERVICE_ACCOUNTS_URL:  ${{ secrets.VITE_API_SERVICE_ACCOUNTS_URL }}
          VITE_API_MASTER_ACCOUNT_URL:    ${{ secrets.VITE_API_MASTER_ACCOUNT_URL }}
          VITE_API_ORDER_STEPS_URL:       ${{ secrets.VITE_API_ORDER_STEPS_URL }}
          VITE_API_EMAIL_TEMPLATES_URL:   ${{ secrets.VITE_API_EMAIL_TEMPLATES_URL }}
          VITE_API_EMAIL_URL:             ${{ secrets.VITE_API_EMAIL_URL }}
          GEMINI_API_KEY:                 ${{ secrets.GEMINI_API_KEY }}
```

> **Note on `system_prompt` parameter:** `anthropics/claude-code-action@v1` accepts `system_prompt`
> (not `--append-system-prompt` as a CLI arg). This is the correct parameter name per the action docs.

### `.github/workflows/auto-fix-ci.yml`

```yaml
name: Auto Fix CI Failure
on:
  workflow_run:
    workflows: ["Build & Deploy to Cloudflare Pages"]
    types: [completed]
  workflow_dispatch:

jobs:
  auto-fix-ci:
    if: github.event.workflow_run.conclusion == 'failure' || github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "/fix-issue-log ci"
          allowed_tools: "Bash,Read,Write,Edit,mcp__github__create_pull_request,mcp__github__update_pull_request,mcp__github__add_issue_comment,mcp__github__enable_pr_auto_merge"
        env:
          # same env block as above (required for npm run build to succeed)
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          # ... (all same secrets)
```

---

## Part 7: CODEOWNERS + branch-protection (Task E — 3 files)

### `.github/CODEOWNERS`

```
# Auth / permissions / security — always require human review
src/contexts/PermissionContext.tsx    @kenstudenthk
src/services/authService.ts           @kenstudenthk
src/services/permissionService.ts     @kenstudenthk
src/lib/supabase.ts                   @kenstudenthk

# Build / CI / deps
.github/workflows/**                  @kenstudenthk
package.json                          @kenstudenthk
vite.config.ts                        @kenstudenthk
tsconfig.json                         @kenstudenthk
```

### `docs/branch-protection-setup.md` (manual instructions)

Documents the one-time GitHub UI steps:
1. Settings → Branches → Add rule for `main`
2. ✅ Require a pull request before merging
3. ✅ Require approvals: 1 (CODEOWNERS paths need 1 human approval)
4. ✅ Require status checks: `build` (from `deploy.yml`)
5. ✅ Allow auto-merge (enables the `enable_pr_auto_merge` API call to work)
6. Auto-merge method: Squash

### `.github/ISSUE_TEMPLATE/bug-auto-fix.yml`

Structured form with: file/component field, reproduction steps, error message,
expected vs actual behavior. Pre-applies `auto-fix` label so the action fires automatically.

### `.github/pull_request_template.md`

Auto-populated sections: What was fixed, Risk level (auto-fill), gates checklist, run-log path, agent verdicts.

---

## Part 8: Context-control restructure (Task F — 8 files)

### Root `CLAUDE.md` (slimmed to ≤80 lines)

Keep only: rules table, commands, env vars, tech stack one-liner, auto-fix workflow one-liner,
and a **Folder Docs** table pointing to all per-folder `CLAUDE.md` files.
Strip: component conventions, design tokens, route table, service file table, auth deep-dives.
All that detail moves to the per-folder files.

### Per-folder `CLAUDE.md` files (7 — all lazy-loaded, no `@import`)

| File | Content |
|---|---|
| `src/services/CLAUDE.md` | POST envelope `{action,data,userEmail}`, Supabase vs Power Automate split, `normalizeCloudProvider` rule (from `emailTemplateService.ts`), service file table, `findAll()+filter` pattern |
| `src/components/CLAUDE.md` | Component size ≤200 lines, TutorTooltip usage, combobox patterns, design tokens (`.card`, `.gradient-cta`, `.glass-panel`), fonts |
| `src/components/BulkImport/CLAUDE.md` | 5-step state machine (Upload→Validate→Preview→Conflict→Importing), `BulkImportTypes` schema |
| `src/components/DataEditMode/CLAUDE.md` | DataEditTable/EditableCell/ColumnFilter API, validation patterns, when to use inline edit |
| `src/pages/CLAUDE.md` | Route ownership table, `useOrdersQuery` hook, form patterns, data fetch conventions |
| `src/contexts/CLAUDE.md` | Provider init order, role hierarchy 1–4, `usePermission()`/`hasPermission()` signature, auth-state flags |
| `src/lib/CLAUDE.md` | Supabase client singleton pattern, anon key vs service-role key, when each is used, why this file is in CODEOWNERS |

### `.gitignore` additions

```
run-logs/
logs/
```

---

## Execution order (6 tasks)

| Task | Files | Can test after |
|---|---|---|
| A | Vitest setup (5 files) | `npm test` green |
| B | Agents + command + skill (6 .claude/ files) | dry-run `/fix-issue-log` in session |
| C | Hooks + settings.json + `list-runs` command (4 files) | check `run-logs/session-audit.jsonl` populates |
| D | GitHub Actions (2 files) | `act -n` or push to test branch |
| E | CODEOWNERS + templates (3 files) | open test PR touching `PermissionContext.tsx` → verify needs review |
| F | Root CLAUDE.md slim + 7 nested CLAUDE.md (8 files) | start session in `src/services/` → confirm only root + services CLAUDE.md loaded |

---

## Verification plan

1. `npm test` — 3 seed tests pass.
2. `npm run build` — still green after all config changes.
3. `/fix-issue-log 1` in-session — risk classification runs, loop executes, PR opened, run-log in `run-logs/`.
4. `/list-runs last` — shows formatted audit of the run above.
5. `cat run-logs/session-audit.jsonl` — hook events captured with correct field names.
6. Push to test branch → `auto-fix-issue.yml` YAML validates without error.
7. Open PR touching `src/contexts/PermissionContext.tsx` → CODEOWNERS requires your review, auto-merge NOT enabled.
8. Start session in `src/services/` → confirm only root `CLAUDE.md` + `src/services/CLAUDE.md` visible in context (check via `/memory`).
