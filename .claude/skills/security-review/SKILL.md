---
name: security-review
description: Run before committing. Scans for hardcoded secrets, XSS, injection, insecure API usage, and OWASP issues in this React/Vite project.
---

# Security Review

## Checklist

- [ ] No hardcoded API keys or tokens (check `GEMINI_API_KEY` usage — must come from `process.env`)
- [ ] All user inputs sanitized before rendering in the DOM
- [ ] No raw HTML injection via React props that bypass React's escaping
- [ ] No sensitive data exposed in URL params or `console.log`
- [ ] `Content-Security-Policy` headers considered if deploying to production
- [ ] Role checks use `hasPermission()` from `PermissionContext` — never roll custom logic
- [ ] External URLs validated before `fetch` or `WebFetch` calls
- [ ] Dependencies checked with `npm audit` for known vulnerabilities

## Run

```bash
npm audit
npm run lint
```

Report findings as: CRITICAL (block merge) / HIGH (fix before deploy) / MEDIUM / LOW.
