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

## Gemini AI

`GEMINI_API_KEY` is available via `process.env.GEMINI_API_KEY` (injected by Vite at build time). Use `@google/genai` package for any AI features.
