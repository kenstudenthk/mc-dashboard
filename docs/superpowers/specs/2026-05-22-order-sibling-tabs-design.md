# Design Spec: Order Sibling Tabs

**Date:** 2026-05-22  
**Status:** Approved

## Problem

When multiple orders share the same Service No. (`Title`), users must return to the Order Registry list to navigate between them. There is no in-page way to switch between sibling orders.

## Goal

Add a narrow vertical tab column to the left of the existing Order Details layout. Each tab represents one order sharing the same Service No., labelled "Order 1", "Order 2", etc. (sorted by ID ascending). Clicking a tab navigates to that order's detail page. The column is hidden when there is only one order for the Service No.

## Constraints

- Do not change the width of the Order Detail content area (`flex-1`) or the SECTIONS sidebar (`w-52`).
- The new tab column appears to the left of the existing sidebar, only when siblings ≥ 2.

## Layout

**Before (always):**
```
[w-52 SECTIONS sidebar]  [flex-1 content]
```

**After (when siblings ≥ 2):**
```
[w-14 Order tabs column]  [w-52 SECTIONS sidebar]  [flex-1 content]
```

The outer flex container (`flex gap-6 items-start`) gains a conditional leading child when siblings exist.

## Data Layer

### Power Automate — new action: `GET_BY_TITLE`

Request envelope:
```json
{ "action": "GET_BY_TITLE", "data": { "Title": "MC-XXXX" }, "userEmail": "..." }
```

SharePoint filter: `$filter=Title eq '${Title}'`

Response: array of Order objects (same shape as existing order responses), sorted by ID ascending by the Flow or client-side.

### `orderService.findAllByTitle(title: string): Promise<Order[]>`

New method in `src/services/orderService.ts`. POSTs `GET_BY_TITLE` to `VITE_API_ORDERS_URL`. Returns `Order[]` sorted by `id` ascending (sort client-side after response).

### `useOrdersByTitle(title: string | undefined)` hook

New hook in `src/services/useOrdersQuery.ts`.

```ts
export function useOrdersByTitle(title: string | undefined) {
  return useQuery<Order[]>({
    queryKey: ['orders-by-title', title],
    queryFn: () => orderService.findAllByTitle(title!),
    enabled: !!title,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
```

## UI Component: Order Sibling Tabs Column

### Placement

Rendered inside the `flex gap-6 items-start` container in `OrderDetails`, as the first child, conditionally.

### Appearance

- Width: `w-14` (56px), `shrink-0`
- Same card style as SECTIONS sidebar: `bg-white rounded-2xl`, `border: 1px solid #dad4c8`, same `boxShadow`
- `position: sticky`, `top: 1.5rem`, `zIndex: 10` — matches sidebar stickiness
- Padding: `p-2`

### Tab Buttons

- One button per sibling order, vertically stacked
- Label: two lines — `"Order"` + `String(index + 1)` (index = position in ID-sorted array)
- Font: `text-xs font-medium text-center`
- Active (current order): `background: #094cb2`, `color: white`, `border-radius: rounded-xl`
- Inactive: `color: #9f9b93`, hover → `background: #faf9f7`
- Click: `useNavigate(\`/orders/${sibling.id}\`)`

### Visibility Rule

```ts
const showTabs = siblings.length >= 2;
```

When `showTabs` is false, nothing is rendered for this column — layout is unchanged from today.

### Loading State

While `useOrdersByTitle` is loading, the column is not rendered (same as `showTabs = false`). Tabs appear once data arrives.

## Files Changed

| File | Change |
|------|--------|
| `src/services/orderService.ts` | Add `findAllByTitle(title)` method |
| `src/services/useOrdersQuery.ts` | Add `useOrdersByTitle(title)` hook |
| `src/pages/OrderDetails.tsx` | Import hook, derive siblings, render tab column |

## What Could Break

- If `GET_BY_TITLE` is not yet wired in the Power Automate Flow, `findAllByTitle` will error → hook returns error state → tabs column stays hidden (safe default).
- Navigating between sibling orders resets all local state (edit mode, remark quick-edit, expanded emails). This is expected behaviour for a page navigation.
- If two sibling orders are open in separate tabs, the React Query cache is shared — cache invalidation on save in one tab will refresh the other on next focus. This is existing behaviour, not a regression.
