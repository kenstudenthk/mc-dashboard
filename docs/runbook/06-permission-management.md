# Permission Management Plan

This plan covers app-wide permission control for MC Dashboard using a SharePoint `PermissionRules` list, Power Automate, and React permission gates.

The target is data-driven permissions: when a new page, button, section, field, or function needs access control, add a rule row in SharePoint and add one `can(...)` check in the app code for that resource.

## Decision

Build permission management as a dedicated subsection under `Settings`, not a top-level navigation page.

Recommended route:

```text
/settings/permissions
```

Reason:

- Permission management is admin configuration, not daily operational work.
- It belongs near existing team/user management in Settings.
- It should not compete with operational pages such as Orders, Customers, Reports, or Services.
- A future admin shortcut can be added to navigation if usage becomes frequent.

## Current Setup To Respect

The user has already created:

- SharePoint `PermissionRules` list.
- Power Automate Flow actions.
- GitHub/Cloudflare variable:

```text
VITE_API_PERMISSION_SETTING_URL
```

Important implementation note:

- User role service should use `VITE_API_PERMISSION_URL` for `App_UserRoles`.
- Permission-rule service should use `VITE_API_PERMISSION_SETTING_URL` for `PermissionRules`.
- Do not rename the existing variable unless the existing user/role flow is also migrated.

## SharePoint List

List name:

```text
PermissionRules
```

Recommended columns:

| Column | SharePoint type | Required | Notes |
|---|---|---:|---|
| `Title` | Single line text | Yes | Auto-generated key, e.g. `Page.Customers.View` |
| `ResourceType` | Choice | Yes | `Page`, `Button`, `Field`, `Function`, `Section` |
| `ResourceKey` | Single line text | Yes | Stable app key, e.g. `Customers`, `Orders.Export` |
| `Action` | Choice | Yes | `View`, `Create`, `Edit`, `Delete`, `Export`, `Approve`, `Click`, `Use`, `Manage` |
| `AllowedRoles` | Choice, multiple | Yes | `Developer`, `Global Admin`, `Admin`, `User` |
| `IsActive` | Yes/No | Yes | Default `Yes`; soft delete sets this to `No` |
| `Description` | Multiple lines text | No | Plain-English purpose |
| `SortOrder` | Number | No | Optional display ordering |

Recommended `Title` expression for Power Automate `CREATE`:

```text
concat(body('Parse_JSON')?['data']?['ResourceType'], '.', body('Parse_JSON')?['data']?['ResourceKey'], '.', body('Parse_JSON')?['data']?['Action'])
```

## Permission Rule Examples

| Title | ResourceType | ResourceKey | Action | AllowedRoles | IsActive |
|---|---|---|---|---|---|
| `Page.Dashboard.View` | `Page` | `Dashboard` | `View` | `Developer, Global Admin, Admin, User` | Yes |
| `Page.Customers.View` | `Page` | `Customers` | `View` | `Developer, Global Admin, Admin` | Yes |
| `Page.Reports.View` | `Page` | `Reports` | `View` | `Developer, Global Admin, Admin` | Yes |
| `Page.Settings.View` | `Page` | `Settings` | `View` | `Developer, Global Admin` | Yes |
| `Function.Settings.Permissions.Manage` | `Function` | `Settings.Permissions` | `Manage` | `Developer, Global Admin` | Yes |
| `Button.Reports.Export.Click` | `Button` | `Reports.Export` | `Click` | `Developer, Global Admin, Admin` | Yes |
| `Button.Customer.Delete.Click` | `Button` | `Customer.Delete` | `Click` | `Developer, Global Admin` | Yes |
| `Field.Customer.SpecialNotes.Edit` | `Field` | `Customer.SpecialNotes` | `Edit` | `Developer, Global Admin, Admin` | Yes |

## Power Automate Actions

Minimum app access-control action:

```text
GET_ALL
```

Admin management actions:

```text
GET_ALL
GET_PERMISSION
CREATE
UPDATE
DELETE
```

Recommended behavior:

| Action | Purpose |
|---|---|
| `GET_ALL` | Return permission rules. Runtime calls should request active rules only; Settings admin calls must be able to return active and disabled rules |
| `GET_PERMISSION` | Return one rule matching `ResourceType + ResourceKey + Action + IsActive` |
| `CREATE` | Create one permission rule |
| `UPDATE` | Update by SharePoint `ID` |
| `DELETE` | Soft delete by SharePoint `ID`; set `IsActive = false`. Do not physically delete SharePoint rows |

Use two `GET_ALL` modes:

| Caller | Request | Expected result |
|---|---|---|
| Runtime permission context | `{ "action": "GET_ALL", "data": { "includeInactive": false } }` | Active rules only |
| Settings permission admin UI | `{ "action": "GET_ALL", "data": { "includeInactive": true } }` | Active and disabled rules |

Standard success response:

```json
{
  "success": true,
  "data": {
    "value": []
  }
}
```

Standard single-item success response:

```json
{
  "success": true,
  "data": {}
}
```

Standard error response:

```json
{
  "success": false,
  "error": {
    "message": "Permission rule error"
  }
}
```

### Parse JSON Schema

Use this schema for request body parsing:

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string"
    },
    "data": {
      "type": ["object", "null"],
      "properties": {
        "id": {
          "type": ["integer", "string", "null"]
        },
        "ID": {
          "type": ["integer", "string", "null"]
        },
        "Title": {
          "type": ["string", "null"]
        },
        "ResourceType": {
          "type": ["string", "null"]
        },
        "ResourceKey": {
          "type": ["string", "null"]
        },
        "Action": {
          "type": ["string", "null"]
        },
        "AllowedRoles": {
          "type": ["array", "null"],
          "items": {
            "type": "string"
          }
        },
        "IsActive": {
          "type": ["boolean", "string", "null"]
        },
        "Description": {
          "type": ["string", "null"]
        },
        "SortOrder": {
          "type": ["integer", "string", "null"]
        },
        "includeInactive": {
          "type": ["boolean", "string", "null"]
        }
      }
    },
    "userEmail": {
      "type": ["string", "null"]
    }
  },
  "required": ["action"]
}
```

### GET_PERMISSION Filter Query

Use uppercase field names to match SharePoint columns:

```text
ResourceType eq '@{body('Parse_JSON')?['data']?['ResourceType']}' and ResourceKey eq '@{body('Parse_JSON')?['data']?['ResourceKey']}' and Action eq '@{body('Parse_JSON')?['data']?['Action']}' and IsActive eq 1
```

### UPDATE and DELETE Locate Record

Use SharePoint item `ID`.

For `UPDATE`:

```text
body('Parse_JSON')?['data']?['id']
```

For `DELETE`:

```text
body('Parse_JSON')?['data']?['id']
```

Then set:

```text
IsActive = No
```

Do not locate update/delete by `Title`, `ResourceKey`, or `Action`. Those can change or duplicate by mistake; `ID` is stable.

## Frontend Architecture

Add a new service:

```text
src/services/permissionRuleService.ts
```

It should use:

```text
import.meta.env.VITE_API_PERMISSION_SETTING_URL
```

Expected service methods:

```ts
findAll(options?: { includeInactive?: boolean }): Promise<PermissionRule[]>
findOne(input: PermissionLookup): Promise<PermissionRule | null>
create(data: CreatePermissionRuleInput, userEmail: string): Promise<PermissionRule>
update(id: number, data: Partial<CreatePermissionRuleInput>, userEmail: string): Promise<PermissionRule>
disable(id: number, userEmail: string): Promise<PermissionRule>
```

Add normalization for SharePoint multi-choice fields:

```ts
AllowedRoles: string[] // support both ["Admin"] and { results: ["Admin"] }
```

### Permission Context Upgrade

Current app has `PermissionContext` for role/session. Extend it without breaking existing role checks.

Add:

```ts
type PermissionResourceType = "Page" | "Button" | "Field" | "Function" | "Section";
type PermissionAction = "View" | "Create" | "Edit" | "Delete" | "Export" | "Approve" | "Click" | "Use" | "Manage";

can(resourceType: PermissionResourceType, resourceKey: string, action: PermissionAction): boolean
canAny(rules: PermissionCheck[]): boolean
canAll(rules: PermissionCheck[]): boolean
refreshPermissionRules(): Promise<void>
permissionRules: PermissionRule[]
permissionLoading: boolean
permissionError: string | null
```

Keep temporarily:

```ts
hasPermission(requiredRole)
```

Migration rule:

- Existing role hierarchy remains for login and backward compatibility.
- New UI/page/action access should use `can(...)`.
- Existing login role fallback can remain for session authorization, but protected resources should fail closed when permission rules are unavailable.

### Evaluation Logic

Rule evaluation:

1. User must be authenticated.
2. User role must be active from existing user permission list.
3. Find active rules where:
   - `ResourceType` matches.
   - `ResourceKey` matches.
   - `Action` matches.
   - `AllowedRoles` includes current user role.
4. If matching active rule exists, allow.
5. Otherwise deny.

Default behavior:

- Missing permission rule means denied for protected resources.
- During migration, pages not yet configured can use a temporary fallback map, but this should be removed after full rollout.
- Duplicate active rules for the same `ResourceType + ResourceKey + Action` should be treated as a configuration problem and highlighted in Settings.

### Caching

Use memory cache in `PermissionProvider`.

Optional session cache:

```text
sessionStorage key = mc-dashboard:permission-rules
```

Recommended:

- Load rules on login/session startup.
- Refresh after create/update/disable.
- Refresh on browser focus after 5-10 minutes.
- If the existing user/role lookup fails, current login fallback behavior may still authorize the session from Supabase metadata.
- If the new permission-rule load fails, fail closed for protected resources and show `NoPermission`/loading-safe UI rather than exposing protected pages.
- If refresh fails after rules already loaded, keep current rules and show admin-only stale warning.

## Frontend Enforcement Plan

### Route Guards

Create:

```text
src/components/PermissionGate.tsx
src/components/ProtectedRoute.tsx
src/components/NoPermission.tsx
```

Route guards should cover every route in `App.tsx`, including direct URL access and browser refresh on protected URLs.

| Route | Permission |
|---|---|
| `/` | `Page / Dashboard / View` |
| `/orders` | `Page / Orders / View` |
| `/orders/new` | `Page / NewOrder / View` |
| `/orders/:id` | `Page / OrderDetails / View` |
| `/customers` | `Page / Customers / View` |
| `/customers/:id` | `Page / CustomerProfile / View` |
| `/services` | `Page / ServiceCatalog / View` |
| `/services/:id` | `Page / ServiceDetails / View` |
| `/reports` | `Page / Reports / View` |
| `/quick-links` | `Page / QuickLinks / View` |
| `/settings` | `Page / Settings / View` |
| `/settings/permissions` | `Function / Settings.Permissions / Manage` |
| `/email-templates` | `Page / EmailTemplates / View` |
| `/audit-log` | `Page / AuditLog / View` |
| `/help` | `Page / Help / View` |
| `/feedback` | `Page / Feedback / View` |
| `/feedback/new` | `Page / FeedbackNew / View` |

### Navigation Guards

Update:

```text
src/components/TopNav.tsx
src/components/Sidebar.tsx
```

Behavior:

- Normal users: hide nav items they cannot access.
- Admin-adjacent users: disabled nav with tooltip is acceptable for Settings subitems.
- Never show permission-management links unless user can `Function / Settings.Permissions / Manage`.

### Action Guards

Use `PermissionGate` or `can(...)` around actions:

| Area | Permission |
|---|---|
| Add customer | `Button / Customers.Add / Click` |
| Edit customer | `Function / Customer.Edit / Use` |
| Delete customer | `Button / Customer.Delete / Click` |
| Export reports | `Button / Reports.Export / Click` |
| Manage email templates | `Function / EmailTemplates.Manage / Manage` |
| Manage quick links | `Function / QuickLinks.Manage / Manage` |
| Manage users | `Function / Settings.Users / Manage` |
| Manage permission rules | `Function / Settings.Permissions / Manage` |

For destructive controls:

- Prefer hide for users who should never know the action exists.
- Prefer disabled with tooltip when user can view the object but cannot perform the action.

## Settings Permission UI Plan

Location:

```text
Settings -> Permissions
```

Use a calm, dense operational dashboard style. Avoid a marketing hero. Keep it table-first and matrix-first.

### Live Control Requirement

The Settings permission UI is the live control panel for app access, not only a SharePoint row editor.

When an admin creates, updates, disables, or re-enables a rule:

1. Call the matching Power Automate action.
2. On success, call `refreshPermissionRules()`.
3. Recalculate route guards, nav visibility, action gates, role summaries, and matrix status from the latest rules.
4. Show the changed effective access in the Settings UI without requiring logout/login.

Example:

If `Page / Reports / View` removes `User` from `AllowedRoles`, then a `User` session should reflect it after permission refresh:

- `/reports` direct URL shows `NoPermission`.
- Reports nav item is hidden or disabled.
- Reports export button is inaccessible.
- Role summary lists `Reports` under blocked resources for `User`.
- Permission matrix shows `User` as blocked for `Reports / View`.

If an admin later adds `User` back to `AllowedRoles`, the same controls should become available after refresh.

### Header

Content:

- Title: `Permissions`
- Subtitle: `Control role access to dashboard resources.`
- Small logo: use `public/HKTemailLogo.png` in the header area only, not repeated in cards.

### Summary Band

Show:

| Metric | Meaning |
|---|---|
| Roles | Count of roles currently used |
| Resources | Count of protected resources |
| Active Rules | `IsActive = Yes` count |
| Disabled Rules | `IsActive = No` count |
| Missing Coverage | Known app resources without active rule |

### Role Access Summary

Purpose:

- Let admin understand what each role can access now.

Layout:

- Role cards or compact table rows for `Developer`, `Global Admin`, `Admin`, `User`.
- Each role row shows:
  - Allowed pages.
  - Blocked pages.
  - High-risk functions.
  - Disabled/no matching rules.

Example:

```text
Role: User
Allowed: Dashboard, Orders
Blocked: Customers, Reports, Settings, Audit Log
Risk access: None
```

### Permission Matrix

Rows:

- Resources, grouped by type:
  - Pages
  - Buttons
  - Functions
  - Fields
  - Sections

Columns:

- Developer
- Global Admin
- Admin
- User

Cell states:

| State | Meaning | Suggested style |
|---|---|---|
| Allowed | Role is included in active rule | Green badge/check |
| Blocked | Role not included | Gray or red blocked icon |
| Disabled | Rule exists but inactive | Gray badge |
| Missing | No rule exists | Amber warning |

Clicking a row opens the rule editor drawer.

### Resource Rules List

Columns:

| Column | Meaning |
|---|---|
| Resource | `ResourceType + ResourceKey` |
| Action | `Action` |
| Allowed roles | Role chips |
| Status | Active/Disabled/Missing |
| Description | Short explanation |
| Updated | Optional if PA/SPO returns modified fields |
| Actions | Edit, Disable, Duplicate |

Filters:

- Resource type.
- Role.
- Status.
- Action.
- Search by `ResourceKey`.

### Rule Editor Drawer

Use side drawer instead of full page.

Fields:

- `ResourceType` choice.
- `ResourceKey` text/combo.
- `Action` choice.
- `AllowedRoles` multi-select.
- `IsActive` toggle.
- `Description` textarea.
- `SortOrder` number.

Show generated title preview:

```text
Page.Customers.View
```

Show plain-English explanation:

```text
Developer, Global Admin, and Admin can view the Customers page. User is blocked.
```

Actions:

- `Save rule`.
- `Disable rule`.
- `Duplicate`.
- `Cancel`.

Destructive behavior:

- Use `Disable` as primary removal path.
- Physical delete is not recommended.

### Add Rule Flow

1. Click `Add rule`.
2. Select `ResourceType`.
3. Enter or choose `ResourceKey`.
4. Select `Action`.
5. Select allowed roles.
6. Add description.
7. Review generated title and explanation.
8. Validate that no active rule already exists with the same `ResourceType + ResourceKey + Action`.
9. Save with PA action `CREATE`.
10. Refresh permission rules.
11. Recalculate role summary, matrix, route/nav/action gates.
12. Show toast: `Permission rule saved.`

### Edit Rule Flow

1. Click `Edit`.
2. Load existing rule by SharePoint `ID`.
3. Update fields in the drawer.
4. Show the generated title and effective-access explanation before saving.
5. Validate duplicate active rules.
6. Save with PA action `UPDATE` by `ID`.
7. Refresh permission rules.
8. Recalculate role summary, matrix, route/nav/action gates.
9. Show toast: `Permission rule updated.`

### Disable Rule Flow

1. Click `Disable`.
2. Confirmation explains effect:

```text
This rule will stop granting access. Users may lose access if no other active rule allows it.
```

3. Block the change if it would remove the last active permission-management admin rule.
4. PA action `DELETE` updates `IsActive = false`.
5. Refresh permission rules.
6. Recalculate role summary, matrix, route/nav/action gates.
7. Show toast: `Permission rule disabled.`

### Re-enable Rule Flow

1. Switch `IsActive` back to `Yes` in the edit drawer.
2. Save with PA action `UPDATE` by `ID`.
3. Refresh permission rules.
4. Recalculate role summary, matrix, route/nav/action gates.
5. Show toast: `Permission rule enabled.`

## No-Permission UX

Page-level denial:

```text
You do not have access to Customers.
Contact an administrator if this access is needed for your role.
```

Show:

- Page/resource name.
- Current role.
- Missing permission key.
- Button: `Back to Dashboard`.
- Optional button: `Open Help`.

Action-level denial:

```text
Your role can view this customer, but cannot edit customer details.
```

For hidden/disabled action controls:

- Hide destructive controls for normal users.
- Disable with tooltip for admin-adjacent users when useful.

Do not expose sensitive page data before the permission check completes.

## Visual Design Direction

Use operational dashboard styling:

- Dense tables.
- Matrix view.
- Compact role cards.
- Side drawer for editing.
- Clear status chips.
- No large hero sections.
- No decorative gradient/orb backgrounds.

Recommended icons from `lucide-react`:

| Icon | Use |
|---|---|
| `Shield` | Permissions page/header |
| `Lock` | Blocked/no access |
| `Unlock` | Allowed |
| `Eye` | View permission |
| `Pencil` | Edit permission |
| `Ban` | Disabled/blocked |
| `Info` | Explanation tooltip |
| `ToggleLeft`, `ToggleRight` | Active status |
| `Search` | Filter/search |
| `Plus` | Add rule |

Color guidance:

| Meaning | Color |
|---|---|
| Allowed/active | Green |
| View/informational | Blue |
| Partial/missing coverage | Amber |
| Disabled | Gray |
| Blocked/risky | Red |

## Design References

External references used for planning:

- RBAC UI patterns and tree/feature-gating ideas: https://www.rbacui.com/
- Permission matrix admin UI pattern: https://www.creative-tim.com/ui/block/team-permissions-matrix
- Access control matrix concept: https://www.altexsoft.com/blog/access-control-matrix-acm/
- RBAC maintainability and least-privilege guidance: https://www.systemshardening.com/articles/cross-cutting/rbac-design-patterns/

Use these as inspiration only. The MC Dashboard implementation should remain restrained and operational.

## Implementation Phases

### Phase 1 - Inventory

Create a permission inventory:

| Area | Current access | New permission key |
|---|---|---|
| Customers page | User currently should be blocked | `Page / Customers / View` |
| Reports page | User currently should be blocked | `Page / Reports / View` |
| Settings page | Admin only | `Page / Settings / View` |
| User management | Global Admin/Developer | `Function / Settings.Users / Manage` |
| Permission management | Global Admin/Developer | `Function / Settings.Permissions / Manage` |

Then scan all navigation and buttons for add/edit/delete/export/manage behavior.

### Phase 2 - Service And Context

Add:

- `permissionRuleService`.
- Permission rule types.
- `can(...)` helpers in `PermissionContext`.
- Rule normalization.
- Runtime cache.

Keep `hasPermission(...)` during migration.

### Phase 3 - Page And Navigation Guards

Add:

- `ProtectedRoute`.
- `PermissionGate`.
- `NoPermission`.

Migrate:

- `App.tsx` routes.
- `TopNav.tsx`.
- `Sidebar.tsx`.

Start with:

- Customers blocked for `User`.
- Reports blocked for `User`.
- Permission settings only for `Developer` and `Global Admin`.

### Phase 4 - Settings Permission UI

Add Settings subsection:

- Summary band.
- Role access summary.
- Permission matrix.
- Rules table.
- Rule editor drawer.
- Add/edit/disable flows.

### Phase 5 - Action-Level Gates

Add gates for:

- Export.
- Delete.
- Manage templates.
- Manage quick links.
- Manage users.
- Sensitive field edits.

### Phase 6 - Flow-Level Enforcement For Sensitive Actions

Client-side permission checks improve UX but are not enough for security.

For high-risk actions, PA/backend checks are required before executing. The React UI must not be the only enforcement layer.

- Delete records.
- Update permission rules.
- Manage users.
- Export reports.
- Send or update email templates.

Implementation requirement:

- Add a shared permission-check step in each high-risk Power Automate Flow or route the action through a Flow that can verify the caller.
- If the caller does not have the required permission, return:

```json
{
  "success": false,
  "error": {
    "message": "Permission denied"
  }
}
```

### Phase 7 - Audit And Safety

Add audit log entries for:

- Permission rule create/update/disable.
- User role changes.
- Denied attempts for high-risk operations.

Lockout protection:

- Developer keeps emergency access.
- Block disabling the last active rule that allows `Function / Settings.Permissions / Manage` for `Developer` or `Global Admin`.

## Testing Plan

Test roles:

- Developer.
- Global Admin.
- Admin.
- User.

Manual test cases:

| Case | Expected |
|---|---|
| User opens `/customers` | No-permission page |
| User opens `/reports` | No-permission page |
| User nav menu | Customers/Reports hidden or disabled |
| Admin opens Customers | Allowed |
| Admin opens Reports | Allowed |
| User clicks blocked action | Button hidden or disabled with tooltip |
| Global Admin opens Settings Permissions | Allowed |
| Admin opens Settings Permissions | Denied unless rule grants access |
| Disable a rule | `IsActive = No`, access recalculates |
| Add a rule for User Reports View | User can access Reports after refresh |

Build/type check:

```bash
npm run lint
```

Recommended browser checks:

- Desktop width.
- Mobile width.
- Direct URL access to protected routes.
- Refresh page on protected route.
- Slow/failed permission API response.

## Risks And Controls

| Risk | Control |
|---|---|
| Client-only checks can be bypassed | Add PA/backend checks for sensitive actions |
| Admin lockout | Developer emergency access and last-admin-rule protection |
| Rule drift | Role summary and missing coverage indicators |
| Flow latency | Load all rules once and cache in memory |
| SPO multi-choice shape mismatch | Normalize `AllowedRoles.results` and plain arrays |
| Missing rule accidentally grants access | Default deny for protected resources |
| Too many per-button rules | Start with page/function rules, add button/field rules only where needed |

## Recommended First Rules

Seed these before enabling route gates:

| ResourceType | ResourceKey | Action | AllowedRoles |
|---|---|---|---|
| Page | Dashboard | View | Developer, Global Admin, Admin, User |
| Page | Orders | View | Developer, Global Admin, Admin, User |
| Page | NewOrder | View | Developer, Global Admin, Admin, User |
| Page | OrderDetails | View | Developer, Global Admin, Admin, User |
| Page | Customers | View | Developer, Global Admin, Admin |
| Page | CustomerProfile | View | Developer, Global Admin, Admin |
| Page | Reports | View | Developer, Global Admin, Admin |
| Page | ServiceCatalog | View | Developer, Global Admin, Admin, User |
| Page | ServiceDetails | View | Developer, Global Admin, Admin, User |
| Page | QuickLinks | View | Developer, Global Admin, Admin, User |
| Page | EmailTemplates | View | Developer, Global Admin |
| Page | AuditLog | View | Developer, Global Admin |
| Page | Settings | View | Developer, Global Admin |
| Page | Help | View | Developer, Global Admin, Admin, User |
| Page | Feedback | View | Developer, Global Admin, Admin, User |
| Function | Settings.Users | Manage | Developer, Global Admin |
| Function | Settings.Permissions | Manage | Developer, Global Admin |
| Button | Reports.Export | Click | Developer, Global Admin, Admin |
| Button | Customer.Delete | Click | Developer, Global Admin |
