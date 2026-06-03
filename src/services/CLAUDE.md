# Services

Data flow: `Component → src/services/<entity>Service.ts → HTTP POST → Power Automate → SharePoint`

Request envelope: `{ action, data, userEmail }`

Never call `fetch()` directly in components — always use a service.
Store Power Automate URLs in `.env.local` as `VITE_API_<NAME>_URL`.
Validate all API responses at the boundary before using in UI.

## normalizeCloudProvider rule

`order.CloudProvider` stores raw SharePoint display names. Always call
`normalizeCloudProvider(order.CloudProvider)` from `emailTemplateService.ts` before any
comparison or lookup. Never use the raw string.

```ts
// correct
const serviceType = normalizeCloudProvider(order.CloudProvider);
const filtered = templates.filter(t => t.ServiceType === serviceType);
```

Prefer `findAll()` + client-side filter over `findByService()` — the GET_BY_SERVICE action
may not match all alias variants.

## Service files

| File | Entity |
|---|---|
| `orderService.ts` | Orders |
| `customerService.ts` | Customers |
| `serviceAccountService.ts` | Service accounts |
| `orderTimelineService.ts` | Order timeline events |
| `orderStepsService.ts` | Order checklist steps |
| `auditLogService.ts` | Audit log entries |
| `quickLinkService.ts` | Quick links |
| `permissionService.ts` | User permissions (SharePoint) |
| `emailTemplateService.ts` | Email templates + `normalizeCloudProvider` |
| `emailService.ts` | Send email via Power Automate |
| `feedbackService.ts` | Feedback (Supabase) |
| `authService.ts` | Auth operations (Supabase) |
| `bulkImportService.ts` | Bulk CSV import logic |
| `pinnedOrderService.ts` | Pinned orders (local storage) |
| `useOrdersQuery.ts` | React hook wrapping order fetch with caching |
