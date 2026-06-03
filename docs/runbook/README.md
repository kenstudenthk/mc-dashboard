# MC Dashboard — Runbook

Operations and development reference for the Multi-Cloud Order Management Dashboard.

## System Architecture

```
Browser
  └── React App (Cloudflare Pages — mcdashboard.kkhome.uk)
        ├── Supabase Auth       (login / role sessions)
        └── Power Automate Flows
              └── SharePoint Lists  (all business data)
```

## Key Links

| Resource | URL |
|---|---|
| Production app | https://mcdashboard.kkhome.uk |
| Cloudflare Pages | https://dash.cloudflare.com → Pages → mc-dashboard-git |
| Supabase Dashboard | https://supabase.com/dashboard |
| SharePoint Site | https://pccw0.sharepoint.com/sites/BonniesTeam |
| Power Automate | https://make.powerautomate.com |
| GitHub Repo | https://github.com/kenstudenthk/mc-dashboard |

## Quick Command Reference

```bash
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build (TypeScript + Vite bundle)
npm run lint      # TypeScript type-check only
npm run preview   # Preview production build locally
npm run deploy    # Deploy to Cloudflare Pages (requires wrangler auth)
```

## Runbook Index

| File | Purpose |
|---|---|
| [01-local-setup.md](./01-local-setup.md) | Set up local dev environment from scratch |
| [02-data-layer.md](./02-data-layer.md) | SharePoint list structure and Power Automate Flow maintenance |
| [03-troubleshooting.md](./03-troubleshooting.md) | Common issues, fault diagnosis, and user/role management |
| [04-migration.md](./04-migration.md) | One-time Excel → SharePoint data migration scripts |
| [05-excel-data-finalization.md](./05-excel-data-finalization.md) | Problems in old data, column additions, SA report backfill process |
| [06-permission-management.md](./06-permission-management.md) | Data-driven page, function, button, field, and section permission plan |

## Role Hierarchy (quick ref)

| Role | Level | Can do |
|---|---|---|
| User | 1 | View orders, customers, reports |
| Admin | 2 | Edit data, manage templates |
| Global Admin | 3 | Full access except developer tools |
| Developer | 4 | All access including settings |
