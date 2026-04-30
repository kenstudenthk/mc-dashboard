# Unify Cloud Provider Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a single source of truth for cloud provider names so SPO always stores canonical names (AWS, Alibaba, Azure, GCP, Huawei, Tencent) and every page displays them consistently.

**Architecture:** A new `src/constants/cloudProviders.ts` file owns all canonical names, aliases, and the `normalizeCloudProvider` function. All other files import from this single source — dropdowns use canonical names directly, display components normalize on input, and the duplicate alias maps in `CloudProviderLogo.tsx`, `OrderDetails.tsx`, and `emailTemplateService.ts` are removed.

**Tech Stack:** React 19, TypeScript, Vite 6. No test framework is configured; verification is via `npm run lint` (tsc --noEmit) and visual browser inspection.

---

## File Map

| Action | File | Change |
|--------|------|--------|
| **Create** | `src/constants/cloudProviders.ts` | Canonical names, alias map, `normalizeCloudProvider`, `CLOUD_PROVIDER_OPTIONS` |
| **Modify** | `src/services/emailTemplateService.ts` | Remove local alias map; re-export `normalizeCloudProvider` from constants |
| **Modify** | `src/services/bulkImportService.ts` | Replace local `CLOUD_PROVIDER_VALUES` with import from constants |
| **Modify** | `src/pages/NewOrder.tsx` | Replace local `CLOUD_PROVIDER_OPTIONS` with import from constants |
| **Modify** | `src/components/DataEditMode/EditableCell.tsx` | Replace local `CLOUD_PROVIDER_OPTIONS` with import from constants |
| **Modify** | `src/components/CloudProviderLogo.tsx` | Remove internal `PROVIDER_KEY` map; use `normalizeCloudProvider` instead |
| **Modify** | `src/pages/OrderDetails.tsx` | Update `mapCloudProvider()` to use `normalizeCloudProvider` internally |
| **Modify** | `src/pages/Reports.tsx` | Normalize before building provider filter list and before comparing |
| **Modify** | `src/pages/CustomerProfile.tsx` | Normalize before using `CloudProvider` as a key and in display |
| **Modify** | `src/pages/Dashboard.tsx` | Normalize before displaying `CloudProvider` |

---

### Task 1: Create single source of truth — `src/constants/cloudProviders.ts`

**Files:**
- Create: `src/constants/cloudProviders.ts`

- [ ] **Step 1: Create the constants file**

```typescript
// src/constants/cloudProviders.ts

export const CANONICAL_PROVIDERS = [
  "AWS",
  "Alibaba",
  "Azure",
  "GCP",
  "Huawei",
  "Tencent",
] as const;

export type CanonicalProvider = typeof CANONICAL_PROVIDERS[number];

/** All known display-name aliases → canonical name */
const PROVIDER_ALIASES: Record<string, CanonicalProvider> = {
  // AWS
  "aws (amazon web service)": "AWS",
  "aws (amazon web services)": "AWS",
  "amazon web services": "AWS",
  "amazon web service": "AWS",
  "aws": "AWS",
  // Azure
  "microsoft azure": "Azure",
  "azure": "Azure",
  // GCP
  "google cloud platform (gcp)": "GCP",
  "google cloud platform": "GCP",
  "google cloud": "GCP",
  "gcp": "GCP",
  // Alibaba
  "alibaba cloud": "Alibaba",
  "alicloud": "Alibaba",
  "aliyun": "Alibaba",
  "alibaba": "Alibaba",
  // Huawei
  "huawei cloud ha": "Huawei",
  "huawei cloud": "Huawei",
  "huawei": "Huawei",
  // Tencent
  "tencent cloud": "Tencent",
  "tencent": "Tencent",
};

/**
 * Maps any known alias (case-insensitive) to its canonical name.
 * Returns the original string if no match found.
 */
export function normalizeCloudProvider(raw: string): string {
  if (!raw) return raw;
  return PROVIDER_ALIASES[raw.toLowerCase().trim()] ?? raw;
}

/** Options array for dropdowns — values match what SPO stores */
export const CLOUD_PROVIDER_OPTIONS = CANONICAL_PROVIDERS as unknown as string[];
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npm run lint
```

Expected: no errors about the new file.

- [ ] **Step 3: Commit**

```bash
git add src/constants/cloudProviders.ts
git commit -m "feat: add cloudProviders constants as single source of truth"
```

---

### Task 2: Update `emailTemplateService.ts` — remove duplicate alias map

**Files:**
- Modify: `src/services/emailTemplateService.ts`

- [ ] **Step 1: Replace the alias map and function with an import**

In `src/services/emailTemplateService.ts`, find and remove the block (approximately lines 46–70):

```typescript
const CLOUD_PROVIDER_ALIASES: Record<string, string> = {
  "aws (amazon web service)": "AWS",
  // ... all entries ...
};

export const normalizeCloudProvider = (raw: string): string =>
  CLOUD_PROVIDER_ALIASES[raw.toLowerCase().trim()] ?? raw;
```

Replace with:

```typescript
export { normalizeCloudProvider } from "../constants/cloudProviders";
```

Keep all other code in the file unchanged.

- [ ] **Step 2: Verify no type errors**

```bash
npm run lint
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/emailTemplateService.ts
git commit -m "refactor: re-export normalizeCloudProvider from constants"
```

---

### Task 3: Update `bulkImportService.ts` — replace local canonical list

**Files:**
- Modify: `src/services/bulkImportService.ts`

- [ ] **Step 1: Replace local `CLOUD_PROVIDER_VALUES` with import**

At the top of `src/services/bulkImportService.ts`, add the import:

```typescript
import { CANONICAL_PROVIDERS } from "../constants/cloudProviders";
```

Find and remove the local declaration (approximately lines 30–37):

```typescript
export const CLOUD_PROVIDER_VALUES = [
  "AWS",
  "Azure",
  "Huawei",
  "GCP",
  "Alibaba",
  "Tencent",
] as const;
```

Replace with:

```typescript
export const CLOUD_PROVIDER_VALUES = CANONICAL_PROVIDERS;
```

- [ ] **Step 2: Verify no type errors**

```bash
npm run lint
```

Expected: 0 errors. (The `as const` tuple type is compatible — `CANONICAL_PROVIDERS` is also `as const`.)

- [ ] **Step 3: Commit**

```bash
git add src/services/bulkImportService.ts
git commit -m "refactor: use CANONICAL_PROVIDERS from constants in bulkImportService"
```

---

### Task 4: Update `NewOrder.tsx` — dropdown uses canonical names

**Files:**
- Modify: `src/pages/NewOrder.tsx`

- [ ] **Step 1: Replace local options array**

At the top of `src/pages/NewOrder.tsx`, add the import:

```typescript
import { CLOUD_PROVIDER_OPTIONS } from "../constants/cloudProviders";
```

Find and remove the local declaration (approximately lines 47–54):

```typescript
const CLOUD_PROVIDER_OPTIONS = [
  "AWS (Amazon Web Service)",
  "Microsoft Azure",
  "Huawei Cloud",
  "Google Cloud Platform (GCP)",
  "AliCloud",
  "Tencent",
];
```

The constant name is the same, so no other changes are needed — all existing `CLOUD_PROVIDER_OPTIONS` references will automatically use the new array.

- [ ] **Step 2: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 3: Open the app and verify the dropdown shows canonical names**

```bash
npm run dev
```

Navigate to `/orders/new`, open the Cloud Provider dropdown.  
Expected: options are `AWS`, `Alibaba`, `Azure`, `GCP`, `Huawei`, `Tencent`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/NewOrder.tsx
git commit -m "fix: use canonical cloud provider names in NewOrder dropdown"
```

---

### Task 5: Update `EditableCell.tsx` — inline edit dropdown uses canonical names

**Files:**
- Modify: `src/components/DataEditMode/EditableCell.tsx`

- [ ] **Step 1: Replace local options array**

At the top of `src/components/DataEditMode/EditableCell.tsx`, add the import:

```typescript
import { CLOUD_PROVIDER_OPTIONS } from "../../constants/cloudProviders";
```

Find and remove the local declaration (approximately lines 21–28):

```typescript
const CLOUD_PROVIDER_OPTIONS = [
  "AWS (Amazon Web Service)",
  "Microsoft Azure",
  "Huawei Cloud",
  "Google Cloud Platform (GCP)",
  "AliCloud",
  "Tencent",
];
```

The existing `SELECT_OPTIONS` object references `CLOUD_PROVIDER_OPTIONS` by name — no further changes needed.

- [ ] **Step 2: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DataEditMode/EditableCell.tsx
git commit -m "fix: use canonical cloud provider names in EditableCell dropdown"
```

---

### Task 6: Update `CloudProviderLogo.tsx` — remove duplicate alias map

**Files:**
- Modify: `src/components/CloudProviderLogo.tsx`

The component currently has an internal `PROVIDER_KEY` map that duplicates the alias logic. Replace it with a call to `normalizeCloudProvider`, then lowercase the result to get the internal icon key.

- [ ] **Step 1: Add import at top of file**

```typescript
import { normalizeCloudProvider } from "../constants/cloudProviders";
```

- [ ] **Step 2: Remove the `PROVIDER_KEY` map**

Find and delete the entire `PROVIDER_KEY` object (approximately lines 93–113 — all keys mapping aliases to lowercase icon keys like `'aws'`, `'azure'`, etc.).

- [ ] **Step 3: Update the component logic**

Find the line inside `CloudProviderLogo` that reads:

```typescript
const key = PROVIDER_KEY[provider.toLowerCase()] ?? '';
```

Replace it with:

```typescript
const key = normalizeCloudProvider(provider).toLowerCase();
```

- [ ] **Step 4: Update `PROVIDER_DISPLAY` to use canonical-matching keys**

The existing `PROVIDER_DISPLAY` object uses lowercase keys (`aws`, `azure`, etc.) which now come from `normalizeCloudProvider(provider).toLowerCase()`. Verify the keys match:

```typescript
const PROVIDER_DISPLAY: Record<string, string> = {
  aws: 'AWS',
  azure: 'Azure',
  gcp: 'GCP',
  huawei: 'Huawei Cloud',
  alibaba: 'Alibaba Cloud',
  tencent: 'Tencent Cloud',
};
```

Note: `azure` display is changed from `'Microsoft Azure'` to `'Azure'`, and `gcp` from `'Google Cloud'` to `'GCP'`, to match the canonical names the user expects. Update `PROVIDER_DISPLAY` to match the above.

- [ ] **Step 5: Remove the re-export of `PROVIDER_KEY`**

Find the line at the bottom of the file:

```typescript
export { PROVIDER_KEY, PROVIDER_DISPLAY };
```

Replace with:

```typescript
export { PROVIDER_DISPLAY };
```

Search the codebase for any import of `PROVIDER_KEY`:

```bash
grep -r "PROVIDER_KEY" src/
```

If nothing imports it, the removal is safe. If something does, update that import to remove `PROVIDER_KEY`.

- [ ] **Step 6: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 7: Visual check in browser**

```bash
npm run dev
```

Navigate to `/orders` (OrderRegistry). Verify provider logos and names display correctly for all 6 providers.

- [ ] **Step 8: Commit**

```bash
git add src/components/CloudProviderLogo.tsx
git commit -m "refactor: replace internal PROVIDER_KEY map with normalizeCloudProvider"
```

---

### Task 7: Update `OrderDetails.tsx` — fix `mapCloudProvider` to use centralized normalize

**Files:**
- Modify: `src/pages/OrderDetails.tsx`

The local `mapCloudProvider` function does its own string-includes matching. Update it to call `normalizeCloudProvider` instead, while preserving the special `HuaweiHA` case (used by `ServiceTimeline`).

Note: `ServiceTimeline` does not support Tencent — `mapCloudProvider` correctly returns `null` for Tencent, which hides the timeline section. Preserve this.

- [ ] **Step 1: Add import**

```typescript
import { normalizeCloudProvider } from "../constants/cloudProviders";
```

- [ ] **Step 2: Replace `mapCloudProvider` function body**

Find the current function (approximately lines 61–73):

```typescript
function mapCloudProvider(
  raw: string,
): ServiceTimelineProps["provider"] | null {
  const s = raw?.toLowerCase() ?? "";
  if (s.includes("alibaba")) return "Alibaba";
  if (s.includes("azure") || s.includes("microsoft")) return "Azure";
  if (s.includes("gcp") || s.includes("google")) return "GCP";
  if (s.includes("huawei") && (s.includes("ha") || s.includes("hospital")))
    return "HuaweiHA";
  if (s.includes("huawei")) return "Huawei";
  if (s.includes("aws") || s.includes("amazon")) return "AWS";
  return null;
}
```

Replace with:

```typescript
function mapCloudProvider(
  raw: string,
): ServiceTimelineProps["provider"] | null {
  const s = raw?.toLowerCase() ?? "";
  // HuaweiHA is a ServiceTimeline-specific subtype; check before normalizing
  if (s.includes("huawei") && (s.includes("ha") || s.includes("hospital")))
    return "HuaweiHA";
  const canonical = normalizeCloudProvider(raw);
  const timelineProviders: Array<ServiceTimelineProps["provider"]> = [
    "AWS", "Alibaba", "Azure", "GCP", "Huawei",
  ];
  return timelineProviders.includes(canonical as ServiceTimelineProps["provider"])
    ? (canonical as ServiceTimelineProps["provider"])
    : null;
}
```

- [ ] **Step 3: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/OrderDetails.tsx
git commit -m "fix: use normalizeCloudProvider in mapCloudProvider (OrderDetails)"
```

---

### Task 8: Update `Reports.tsx` — normalize before filtering and displaying

**Files:**
- Modify: `src/pages/Reports.tsx`

Two spots need fixing:
1. Building the `providers` list (line ~201) — uses raw values, so duplicate "AWS (Amazon Web Service)" and "AWS" appear as separate entries.
2. Filtering (line ~196) — `o.CloudProvider === provider` will fail if the stored value doesn't exactly match.

- [ ] **Step 1: Add import**

```typescript
import { normalizeCloudProvider } from "../constants/cloudProviders";
```

- [ ] **Step 2: Normalize the providers list**

Find (approximately line 200–202):

```typescript
const providers = useMemo(
  () => [...new Set(orders.map(o => o.CloudProvider).filter(Boolean))].sort() as string[],
  [orders],
);
```

Replace with:

```typescript
const providers = useMemo(
  () => [
    ...new Set(orders.map(o => normalizeCloudProvider(o.CloudProvider ?? "")).filter(Boolean)),
  ].sort() as string[],
  [orders],
);
```

- [ ] **Step 3: Normalize the filter comparison**

Find (approximately line 193–197):

```typescript
const filtered = useMemo(
  () => provider === 'All'
    ? filteredByTime
    : filteredByTime.filter(o => o.CloudProvider === provider),
  [filteredByTime, provider],
);
```

Replace with:

```typescript
const filtered = useMemo(
  () => provider === 'All'
    ? filteredByTime
    : filteredByTime.filter(o => normalizeCloudProvider(o.CloudProvider ?? "") === provider),
  [filteredByTime, provider],
);
```

- [ ] **Step 4: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 5: Visual check**

```bash
npm run dev
```

Navigate to `/reports`. Verify the provider filter dropdown shows 6 clean canonical names with no duplicates.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Reports.tsx
git commit -m "fix: normalize CloudProvider before filtering in Reports"
```

---

### Task 9: Update `CustomerProfile.tsx` — normalize provider key and display

**Files:**
- Modify: `src/pages/CustomerProfile.tsx`

- [ ] **Step 1: Add import**

```typescript
import { normalizeCloudProvider } from "../constants/cloudProviders";
```

- [ ] **Step 2: Normalize in `providerCounts` reducer**

Find (approximately line 95–99):

```typescript
const providerCounts = orders.reduce<Record<string, number>>((acc, o) => {
  const key = o.CloudProvider || "Other";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
```

Replace with:

```typescript
const providerCounts = orders.reduce<Record<string, number>>((acc, o) => {
  const key = o.CloudProvider ? normalizeCloudProvider(o.CloudProvider) : "Other";
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
```

- [ ] **Step 3: Normalize the inline display**

Find (approximately line 494):

```typescript
{order.CloudProvider}
```

Replace with:

```typescript
{normalizeCloudProvider(order.CloudProvider ?? "")}
```

- [ ] **Step 4: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/CustomerProfile.tsx
git commit -m "fix: normalize CloudProvider in CustomerProfile display and grouping"
```

---

### Task 10: Update `Dashboard.tsx` — normalize provider display

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add import**

```typescript
import { normalizeCloudProvider } from "../constants/cloudProviders";
```

- [ ] **Step 2: Normalize the display**

Find (approximately line 405):

```typescript
{order.CloudProvider}
```

Replace with:

```typescript
{normalizeCloudProvider(order.CloudProvider ?? "")}
```

- [ ] **Step 3: Verify no type errors**

```bash
npm run lint
```

- [ ] **Step 4: Visual check**

```bash
npm run dev
```

Navigate to `/` (Dashboard). Verify provider names display as canonical names (AWS, Alibaba, etc.).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx
git commit -m "fix: normalize CloudProvider display in Dashboard"
```

---

### Task 11: Final integration check

- [ ] **Step 1: Full type check**

```bash
npm run lint
```

Expected: 0 errors.

- [ ] **Step 2: Check no old display names remain in dropdowns**

```bash
grep -r "Amazon Web Service\|Microsoft Azure\|Google Cloud Platform\|AliCloud\|Huawei Cloud" src/pages src/components --include="*.tsx" -l
```

Expected: no files (or only files that display raw SPO data, which will be normalized at runtime).

- [ ] **Step 3: Check no stray `PROVIDER_KEY` imports**

```bash
grep -r "PROVIDER_KEY" src/ --include="*.ts" --include="*.tsx"
```

Expected: 0 matches.

- [ ] **Step 4: Check normalizeCloudProvider is only exported from one source**

```bash
grep -r "export.*normalizeCloudProvider" src/ --include="*.ts" --include="*.tsx"
```

Expected: 2 lines — the definition in `constants/cloudProviders.ts` and the re-export in `emailTemplateService.ts`.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify cloud provider unification complete"
```
