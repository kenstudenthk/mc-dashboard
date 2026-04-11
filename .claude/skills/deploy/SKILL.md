---
name: deploy
description: Pre-deploy checklist for the mc-dashboard project. Run before any production deployment.
---

# Deploy Checklist

## Pre-Deploy

- [ ] `npm run lint` passes (no TypeScript errors)
- [ ] `npm run build` succeeds with no warnings
- [ ] `GEMINI_API_KEY` is set in the target environment's secrets
- [ ] `APP_URL` is set to the correct production URL
- [ ] No `console.log` or debug code left in source files

## Build

```bash
npm run build
npm run preview   # verify the production build locally
```

## Verify

- [ ] All routes load without errors (`/`, `/orders`, `/customers`, `/reports`)
- [ ] Role switching works in TopNav
- [ ] Tutor Mode toggles correctly
- [ ] No broken images or missing assets in `dist/`

## Rollback

Keep the previous `dist/` build until the new deployment is confirmed stable.
