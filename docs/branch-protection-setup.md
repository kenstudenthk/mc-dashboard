# Branch Protection Setup

One-time GitHub UI configuration required for the auto-fix workflow to work correctly.

## Steps

1. Go to **Settings → Branches → Add rule** for branch `main`
2. Enable **Require a pull request before merging**
3. Enable **Require approvals: 1** (CODEOWNERS paths require 1 human approval)
4. Enable **Require status checks to pass before merging** → add `build` (from `deploy.yml`)
5. Enable **Allow auto-merge** (required for `mcp__github__enable_pr_auto_merge` API to work)
6. Set auto-merge method to **Squash**

## CODEOWNERS

Files listed in `.github/CODEOWNERS` require human review even for auto-generated PRs.
These include auth, permissions, secrets, and CI config.

## Auto-merge eligibility

Low-risk PRs (CSS, display-only, utility helpers touching ≤3 non-sensitive files) will have
auto-merge enabled automatically. They merge once CI passes without human intervention.

High-risk PRs (any CODEOWNERS file, >3 files changed, >200 LOC diff) are opened as drafts
and require your review.
