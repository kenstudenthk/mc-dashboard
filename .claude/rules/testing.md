# Testing

## Setup (not yet configured)

When adding tests, use **Vitest** (compatible with Vite, zero config) and **Playwright** for E2E.

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
```

Add to `package.json`:
```json
"test": "vitest",
"test:e2e": "playwright test"
```

## Rules

- Write a failing test BEFORE fixing any bug
- Test behavior, not implementation details
- Mock only at system boundaries (API calls, browser APIs)
- Minimum 80% coverage target when tests are introduced

## What to Test

- `PermissionContext`: `hasPermission` hierarchy logic
- `TutorTooltip`: renders children passthrough when tutor mode is off
- Page components: renders without crashing, correct data displayed
- E2E: order creation flow, navigation between pages
