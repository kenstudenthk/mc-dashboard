# Email Template Migration, Admin Editing & UX Plan

## Context

The mc-dashboard already has a full email-template feature: list page (`/email-templates`), edit panel with rich-text editor, 3-step compose flow, and a SharePoint-backed service. The user has `email_template.xlsx` with **15 legacy templates in Sheet1** (used by old PowerApps) and an **empty Sheet2** whose schema the app expects.

Three problems to solve (per user direction):

1. **Data migration** — move 15 Sheet1 rows into the SharePoint template list, normalizing tokens.
2. **Admin/Developer editing** — admins must be able to edit templates after migration. The existing `EmailTemplateEditPanel.tsx` + `/email-templates` page already covers this; we just need to make sure the migrated rows render correctly and add two extra editable fields.
3. **Service-aware Account ID labels** — the "AccountID" field is labelled differently per cloud:
   - AWS → **AWS ID**
   - Alibaba Cloud → **UID**
   - Huawei Cloud → **Account ID**
   - Microsoft Azure → **Microsoft ID** *and* **Azure Subscription ID** (two distinct fields)
   - Google Cloud Platform → **Account ID**
   - Separately, **TID (Tenant ID)** is the user's company's internal customer-service-record identifier — applies across all services, distinct from AccountID.

**User constraints:**
- Do not remove any existing functionality.
- OK to add new columns to Sheet2 if they help migration / future management.

**User decisions (captured):**
- AccountID label → **hardcoded map in code** (`SERVICE_ACCOUNT_ID_LABELS` in `templateVars.ts`).
- Sheet2 extensions → **add `ToRecipients`, `CcRecipients`, `BccRecipients` + `LastUpdatedBy`, `LastUpdatedDate`** (skip Attachment fields).

---

## Recommended Approach

### Part A — Schema Extension (SharePoint list + TypeScript interface)

Extend Sheet2 / SharePoint list with 5 new columns so admins can edit recipients and see audit info:

| Column | Type | Purpose |
|---|---|---|
| `ToRecipients` | Text (plain or `{{Vars}}`) | Default To addresses, e.g. `{{ContactEmail}}` |
| `CcRecipients` | Text | Default CC addresses (supports `{{AMEmail}}; {{ASMEmail}}`) |
| `BccRecipients` | Text | Default BCC |
| `LastUpdatedBy` | Text (email) | Written by service on CREATE/UPDATE using `userEmail` |
| `LastUpdatedDate` | DateTime | Written by service (server-side timestamp in Power Automate flow) |

**File modified:** `src/services/emailTemplateService.ts`
- Extend `EmailTemplate` and `CreateEmailTemplateInput` interfaces with the 5 fields (all optional).
- No client-code changes needed for `LastUpdatedBy/Date` — Power Automate flow sets those automatically.

**User action required:** add the 5 columns to the existing SharePoint list; update the Power Automate flow to stamp `LastUpdatedBy` from `userEmail` and `LastUpdatedDate` from `utcNow()` on CREATE + UPDATE.

### Part B — Data Migration (one-time ETL script)

**New file:** `scripts/migrate-email-templates.mjs` (Node ESM, uses `xlsx` package)

- Read `email_template.xlsx` Sheet1.
- For each row, map:
  | Sheet1 | → | EmailTemplate |
  |---|---|---|
  | `標題 (Title)` | → | `Title` |
  | `Service` | → | `ServiceType` (normalize "Alibaba Cloud"→"Alibaba", "Microsoft Azure"→"Azure", "Google Cloud Platform"→"GCP", "Huawei Cloud"→"Huawei") |
  | `Email-Type` | → | `TemplateCategory` (map per `TEMPLATE_CATEGORY_OPTIONS`; unknown → "General") |
  | `Email-Subject` | → | `Subject` (after token normalization) |
  | `Email-Body` | → | `BodyHTML` (after token normalization) |
  | `Necessary Input Data` | → | `VariableList` (semicolon-joined canonical names — keeps `AccountID`, `TenantID`, `MicrosoftID`, `AzureSubscriptionID` as distinct entries) |
  | `To` | → | `ToRecipients` (after token normalization) |
  | `Cc` | → | `CcRecipients` |
  | `Bcc` | → | `BccRecipients` |
  | — | → | `IsActive = true`, `SortOrder = index` |

- **Token normalization** `[Token Name]` → `{{CamelCase}}` using a central `TOKEN_MAP` constant at the top of the script:
  ```js
  const TOKEN_MAP = {
    "Customer Name": "CustomerName", "CustomerName": "CustomerName",
    "CompanyName": "CustomerName",
    "UID": "AccountID",               // Alibaba → AccountID (labelled "UID")
    "AWS ID": "AccountID",            "AWS Account ID": "AccountID",
    "Tenant ID (TID)": "TenantID",    // internal record ID — DISTINCT from AccountID
    "TID": "TenantID",
    "Microsoft ID": "MicrosoftID",
    "Azure Subscription ID": "AzureSubscriptionID",
    "AM Email": "AMEmail",            "AM": "AMEmail",
    "ASM Email": "ASMEmail",          "ASM": "ASMEmail",
    "Service Number": "ServiceNumber",
    "Register or Admin Email": "AdminEmail",
    "Customer Contact Email": "ContactEmail",
    "CustomerEmail": "ContactEmail",
    "Service Desk no.": "ServiceDeskNo",  "SD": "ServiceDeskNo",
    "Invitation URL": "InvitationURL",    "InvitationURL": "InvitationURL",
  };
  ```
  Note: `TenantID` (internal TID) stays distinct from `AccountID`. `MicrosoftID` and `AzureSubscriptionID` are separate Azure-only vars.

- **Dry-run default**: prints mapped JSON + warnings (unresolved tokens, unknown service/category). Pass `--commit` to POST via `VITE_API_EMAIL_TEMPLATES_URL`.
- **Idempotent guard**: before creating, fetch existing templates; skip any with the same `Title` + `ServiceType`.
- Outputs a migration report: `migration-report-<timestamp>.json`.

### Part C — Service-aware Account ID Labels

**File modified:** `src/utils/templateVars.ts`

1. Add constants — note Azure has TWO identifier fields:
   ```ts
   export const SERVICE_ACCOUNT_ID_LABELS: Record<string, string> = {
     AWS: "AWS ID",
     Alibaba: "UID",
     Huawei: "Account ID",
     GCP: "Account ID",
     Azure: "Microsoft ID",          // primary; Azure also uses AzureSubscriptionID
     General: "Account ID",
   };
   // Extra identifiers beyond the primary AccountID (currently only Azure)
   export const SERVICE_EXTRA_ID_LABELS: Record<string, Array<{ key: string; label: string }>> = {
     Azure: [{ key: "AzureSubscriptionID", label: "Azure Subscription ID" }],
   };
   export const TENANT_ID_LABEL = "Tenant ID (TID)"; // internal record ID, all services
   export const getAccountIDLabel = (serviceType: string): string =>
     SERVICE_ACCOUNT_ID_LABELS[serviceType] ?? "Account ID";
   ```

2. Extend `resolveTemplate` to accept `manualVars?: Record<string, string>` and merge after auto-vars (manual-entered wins when present, otherwise auto-fill is used).

3. Add new var keys: `AMEmail`, `ASMEmail`, `AdminEmail`, `ServiceNumber`, `ServiceDeskNo`, `InvitationURL`, `TenantID`, `MicrosoftID`, `AzureSubscriptionID` — all initialized to `""` so they fall through to manual input. `ContactEmail` / `AccountID` already exist in the var namespace.

### Part D — User-Friendly Compose UX (inline "Fill Missing Variables")

**File modified:** `src/components/EmailComposePanel.tsx`

- New state: `manualVars: Record<string, string>`.
- On template select, parse `selected.VariableList` (semicolon-separated) into `requiredVars`; compute `missingVars = requiredVars - autoResolvableKeys`.
- Render a collapsible card above the To/Cc/Subject/Body fields in **step 2** with one labeled input per `missingVars` entry.
  - Label uses service-aware rename when the var is `AccountID`: `getAccountIDLabel(order.CloudProvider)` (so Alibaba shows "UID", AWS shows "AWS ID"). `TenantID` always labelled "Tenant ID (TID)". For Azure templates that reference `AzureSubscriptionID`, label from `SERVICE_EXTRA_ID_LABELS`.
  - Email-looking labels → `type="email"`; URL-looking → `type="url"`.
  - Remember AM/ASM/Admin emails in `localStorage` keyed by `userEmail` (auto-populate next time).
- Live-update: every keystroke re-runs `resolveTemplate(selected.Subject, order, serviceAccount, manualVars)` + same for Body and initial To/Cc (prefilled from `ToRecipients`/`CcRecipients` with vars resolved on template-select, editable afterwards).
- Existing "Unfilled:" red warning stays and naturally clears as the user fills in values.

**Nothing removed:** template-select step, compose step, preview step, rich-text editor, category badges, send flow, error/success states, tutor tooltips — all untouched.

### Part E — Admin Edit (no code changes)

The existing `src/pages/EmailTemplates.tsx` + `src/components/EmailTemplateEditPanel.tsx` already provide CRUD via `emailTemplateService`. After Part A extends the interface, only one small change to the edit panel:

**File modified:** `src/components/EmailTemplateEditPanel.tsx`
- Add 3 text inputs for `ToRecipients`, `CcRecipients`, `BccRecipients` (reusing the existing `LabelRow` + `inputStyle` pattern, so no new design).
- Surface a read-only "Last updated by {email} at {date}" line at the bottom of the panel when `LastUpdatedBy`/`LastUpdatedDate` are present.
- No new permission logic — Admin gating already exists at the page level.

---

## File Change Summary (5 files — exceeds the 3-file rule; user awareness noted)

| File | Change |
|---|---|
| `src/services/emailTemplateService.ts` | +5 optional fields on `EmailTemplate` & `CreateEmailTemplateInput` |
| `src/utils/templateVars.ts` | Add `SERVICE_ACCOUNT_ID_LABELS`, `getAccountIDLabel`, extend `resolveTemplate` with `manualVars`, add new var keys |
| `src/components/EmailComposePanel.tsx` | Add "Fill Missing Variables" card in step 2 with live preview + localStorage memory |
| `src/components/EmailTemplateEditPanel.tsx` | Add To/Cc/Bcc inputs + audit footer |
| `scripts/migrate-email-templates.mjs` | **New** ETL script with dry-run + `--commit` modes |

Per the workflow rule (stop if >3 files), the work will be executed in two PRs:

- **PR 1 (backend + migration):** `emailTemplateService.ts`, `templateVars.ts`, `scripts/migrate-email-templates.mjs` + SharePoint list + Power Automate flow updates.
- **PR 2 (UX):** `EmailComposePanel.tsx`, `EmailTemplateEditPanel.tsx`.

---

## Verification

**PR 1 — Migration & schema:**
1. Admin adds 5 columns to SharePoint list; updates Power Automate flow.
2. `node scripts/migrate-email-templates.mjs` → prints mapped JSON + unresolved-tokens warnings; no writes.
3. Review output; adjust `TOKEN_MAP` if any legacy tokens still show up unresolved.
4. `node scripts/migrate-email-templates.mjs --commit` → creates 15 templates.
5. Open `/email-templates` → confirm 15 rows, correct ServiceType/Category filters.

**PR 2 — UX:**
1. `npm run dev`; open an AWS order → Send Email → pick an "Account Created" template → missing-vars card shows **AWS ID** label for the AccountID slot.
2. Repeat on Alibaba order → same slot shows **UID**.
3. Repeat on Azure order → shows **Microsoft ID**, and if the template also needs `{{AzureSubscriptionID}}` a second input labelled **Azure Subscription ID** appears.
3a. A template referencing `{{TenantID}}` shows a field labelled **Tenant ID (TID)** on every service.
4. Type values → Subject/Body live-update; "Unfilled:" warning clears.
5. Close + reopen on another order → AM/ASM/Admin emails pre-fill from localStorage.
6. Pick a template with no missing vars → no missing-vars card renders.
7. As Admin, open `/email-templates` → edit a template → change ToRecipients → save → audit footer shows your email + fresh timestamp.
8. Regression: template list filters, category badges, 3-step flow, preview sanitization, send success/error all unchanged.

**Role coverage per user's ask:**
- **Backend / Senior Dev:** schema extension, migration ETL, Power Automate flow update.
- **UI Designer:** service-aware labels, missing-vars card matches existing alert/input styling.
- **UX:** live preview on keystroke, localStorage memory, only-when-needed card (no empty-state noise), admin audit footer for trust.
