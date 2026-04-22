# API Conventions

## Current State

All data is hardcoded mock data inside page components. There is no API layer yet.

## When Adding Real Data

Follow the Repository Pattern:

```ts
// src/services/orderService.ts
interface OrderRepository {
  findAll(): Promise<Order[]>
  findById(id: string): Promise<Order | null>
  create(data: CreateOrderInput): Promise<Order>
  update(id: string, data: Partial<Order>): Promise<Order>
}
```

- Never fetch directly inside page components — use a service layer
- Use a consistent response envelope: `{ data, error, meta }`
- Validate all API responses at the boundary before using in UI
- Handle loading and error states explicitly in every component

## CloudProvider Display Names vs Service Keys

`order.CloudProvider` stores raw SharePoint display names (e.g. `"AWS (Amazon Web Service)"`, `"Microsoft Azure"`, `"Google Cloud Platform (GCP)"`). Template `ServiceType` uses short canonical keys (`"AWS"`, `"Azure"`, `"GCP"`, `"Alibaba"`, `"Huawei"`, `"Tencent"`, `"General"`).

**Rule: always call `normalizeCloudProvider(order.CloudProvider)` before passing it to any service or filter that compares against `ServiceType`.** Never use the raw `order.CloudProvider` string for lookups or comparisons — only for display.

```ts
// ✅ correct
const serviceType = normalizeCloudProvider(order.CloudProvider);
const filtered = templates.filter(t => t.ServiceType === serviceType);

// ❌ wrong — raw display name won't match template keys
const filtered = templates.filter(t => t.ServiceType === order.CloudProvider);
```

`normalizeCloudProvider` is exported from `src/services/emailTemplateService.ts`.

Prefer `findAll()` + client-side filter over `findByService()` for reliability — the Power Automate `GET_BY_SERVICE` action may not match all alias variants.

## Gemini AI

`GEMINI_API_KEY` is available via `process.env.GEMINI_API_KEY` (injected by Vite at build time). Use `@google/genai` package for any AI features.
