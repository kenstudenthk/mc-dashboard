---
description: "List and inspect past auto-fix runs from run-logs/"
argument-hint: "[issue-number | last | all]"
allowed-tools: Bash, Read
model: claude-haiku-4-5
---

List and display auto-fix run history from `run-logs/`.

1. `Bash(ls -t run-logs/fix-*.jsonl 2>/dev/null)` to list runs sorted newest-first.
2. If no argument or `all`: show a table with columns: Timestamp | Source | Loops | Gates | PR URL | Status
3. If `last`: read the most recent file and display full detail.
4. If a number: find runs matching that issue number and display full detail.

Format as a readable markdown table. If no runs exist, say "No auto-fix runs found in run-logs/".
