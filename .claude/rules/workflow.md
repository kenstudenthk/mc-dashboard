# Workflow Rules

## Before Writing Code

- For **planned tasks** (items already in the agreed dev plan), proceed autonomously — no approval needed before each step.
- Only pause and ask when there is a **real blocker**: missing data, ambiguous requirements, or a decision that changes the plan's scope.
- If requirements are ambiguous on a *new* (unplanned) task, ask clarifying questions first.

## Scope Control

- If a task requires changes to more than 3 files, **stop and break it into smaller tasks first**.

## Project Context

- When starting work, describe the relevant tech stack, folder structure, coding conventions, and any anti-patterns to avoid for that task.

## Bug Fixing

- When there is a bug, **start by writing a test that reproduces it**, then fix the implementation until the test passes.
- Never fix a bug without first having a failing test that demonstrates it.

## After Writing Code

- After writing code, **list what could break** and suggest tests to cover those cases.

## When Something Is Wrong

- When the user says something is wrong, **ask clarifying questions before rewriting** — do not immediately start changing code.

## Self-Correction

- Every time the user corrects a mistake, **add a new rule to `CLAUDE.md`** so it never happens again.
