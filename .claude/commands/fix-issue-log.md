---
description: "Full auto-fix pipeline: fetch issue or CI failure or log, analyze, loop-fix, gate, open PR"
argument-hint: "<issue-number> | ci | log:<path>"
allowed-tools: Bash, Read, Write, Edit, mcp__github__issue_read, mcp__github__create_pull_request, mcp__github__add_issue_comment, mcp__github__enable_pr_auto_merge
model: claude-opus-4-5
---

Parse the argument to determine intake source:
- A number (e.g. `42`) → GitHub issue #42
- `ci` → current CI/build failure
- `log:<path>` → runtime log at `<path>` (default: `logs/app.jsonl`)

Spawn the `auto-fix-orchestrator` agent with:
- Intake source and raw content
- `MAX_FIX_LOOPS` from environment (default 3)
- Full ANALYSIS block once computed

When complete, report:
- PR URL (or "no PR created" if nothing to fix)
- Loop count used
- Final gate status (all PASS / some FAIL)
- Run-log path written
