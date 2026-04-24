# Pin Order — Design Spec

**Date:** 2026-04-24  
**Status:** Approved

## Overview

Allow each user to pin their own orders in Order Registry so pinned orders always float to the top of the table, persisted across devices via SharePoint.

---

## Requirements

- Pin is **per-user** (personal, not shared across users)
- Pin state **persists across devices** (stored in SharePoint)
- **No limit** on how many orders a user can pin
- Pin state is managed from the Order Registry table

---

## Data Layer

### SharePoint List: `App_UserPinnedOrders`

| Column | Type | Notes |
|---|---|---|
| `UserEmail` | Single line of text | Identifies the user |
| `OrderId` | Number | References Orders list item ID |
| `PinnedAt` | Date and Time | When the pin was created |

One row = one user pinning one order.

### Power Automate Flow

**Secret name:** `VITE_API_PINNED_ORDER_URL` (already added to GitHub and Cloudflare)

Request envelope:
```json
{ "action": "GET_BY_USER|PIN|UNPIN", "data": { ... }, "userEmail": "..." }
```

| Action | Payload | PA Operation |
|---|---|---|
| `GET_BY_USER` | `{ UserEmail }` | Get items filtered by `UserEmail eq '...'`, return `OrderId[]` |
| `PIN` | `{ UserEmail, OrderId }` | Create item with `UserEmail`, `OrderId`, `PinnedAt = utcNow()` |
| `UNPIN` | `{ UserEmail, OrderId }` | Get item matching UserEmail + OrderId → Delete item |

### New Service: `src/services/pinnedOrderService.ts`

```ts
const FLOW_URL = import.meta.env.VITE_API_PINNED_ORDER_URL;

async function call<T>(body: object): Promise<T> { ... }

export const pinnedOrderService = {
  getPinned(userEmail: string): Promise<number[]>,
  pin(userEmail: string, orderId: number): Promise<void>,
  unpin(userEmail: string, orderId: number): Promise<void>,
};
```

---

## PermissionContext Changes

`src/contexts/PermissionContext.tsx` gains a `userEmail: string` field.

- Default value: `"kk1214@kkhome.uk"` (placeholder until real SharePoint auth is wired)
- Exposed via `usePermission().userEmail`
- Future: populated from `API_Permissions` response on app load

---

## OrderRegistry Changes (`src/pages/OrderRegistry.tsx`)

### State

```ts
const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
```

### On Mount

Call `pinnedOrderService.getPinned(userEmail)` and hydrate `pinnedIds`. Runs once when `userEmail` is available.

### Sort Logic

Before rendering rows, stable-sort the order list: pinned orders first (preserving their relative order), then unpinned orders (preserving their relative order). Other sort/filter logic is applied on top of this.

### Pin Toggle (Optimistic Update)

1. Immediately update `pinnedIds` state (UI reflects change instantly)
2. Call `pinnedOrderService.pin` or `pinnedOrderService.unpin` in background
3. On error: revert `pinnedIds` to previous state and show error toast

### UI

- Action column gains a pin icon button (Lucide `Pin` / `PinOff`)
- **Pinned:** filled blue `Pin` icon — click to unpin
- **Unpinned:** grey `PinOff` icon — click to pin
- Pinned rows display a subtle left border or badge to make them visually distinct

---

## Files Changed

| File | Change |
|---|---|
| `src/contexts/PermissionContext.tsx` | Add `userEmail: string` field |
| `src/services/pinnedOrderService.ts` | New file — PA Flow calls for pin/unpin/get |
| `src/pages/OrderRegistry.tsx` | Pin state, sort logic, pin toggle button |

**Total: 3 files** (within the CLAUDE.md 3-file limit)

---

## Error Handling

- `getPinned` failure on load: silently degrade (no pins shown), no blocking error
- `pin`/`unpin` failure: revert optimistic update, show error toast
- Empty `userEmail`: skip the `getPinned` call entirely (no-op)

---

## Out of Scope

- Pinned orders on any page other than Order Registry
- Global/shared pins visible to all users
- Pin count limits
