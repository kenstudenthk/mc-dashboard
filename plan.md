# MC Dashboard — Implementation Plan

## Phase 1: Wire Up All Order Form Fields (Current Task)

### Background

The `NewOrder` form has many fields that are **not yet saved** to SharePoint. Most fields have no state variable and are not included in the API payload. This plan documents all required SharePoint columns and the corresponding code changes needed.

---

## Step 1: Create SharePoint Columns in the Orders List

The following columns need to be added to the **Orders** SharePoint List. Columns already existing are marked ✅.

### Order Information

| Column Name        | SP Type                   | Notes                              | Status |
|--------------------|---------------------------|------------------------------------|--------|
| `Title`            | Single line of text       | Default column, used for Service No. | ✅ Exists |
| `Status`           | Choice                    | Completed, Account Created, Pending for order issued, Processing, Cancelled, Pending Closure, Pending for other parties | ✅ Exists |
| `OrderType`        | Choice                    | New Install, Misc Change, Contract Renewal, Termination, Pre-Pro | ✅ Exists |
| `ServiceType`      | Single line of text       | e.g. "Offset Amount"               | ❌ Create |
| `OasisNumber`      | Single line of text       | e.g. "CB23-00007546\1"             | ❌ Create |
| `OrderReceiveDate` | Date and Time             | Date only (no time needed)         | ❌ Create |
| `SRD`              | Date and Time             | Required field                     | ✅ Exists |
| `CxSCompleteDate`  | Date and Time             | Date only                          | ❌ Create |
| `Amount`           | Number                    | Decimal, 2 places                  | ✅ Exists |

### Customer Information

| Column Name       | SP Type                   | Notes                              | Status |
|-------------------|---------------------------|------------------------------------|--------|
| `CustomerID`      | Lookup (→ Customers list) | Lookup to customer record          | ✅ Exists |
| `CustomerName`    | Single line of text       | Denormalised name                  | ✅ Exists |
| `ContactPerson`   | Single line of text       | e.g. "Don Ng"                      | ❌ Create |
| `ContactNo`       | Single line of text       | e.g. "67594210"                    | ❌ Create |
| `ContactEmail`    | Single line of text       | Contact email                      | ❌ Create |
| `BillingAddress`  | Multiple lines of text    | Full billing address               | ❌ Create |

### Cloud Service Details

| Column Name        | SP Type                   | Notes                              | Status |
|--------------------|---------------------------|------------------------------------|--------|
| `CloudProvider`    | Choice                    | AWS, Azure, Huawei, GCP, Alibaba, Tencent | ✅ Exists |
| `AccountID`        | Single line of text       | Primary account/root ID per provider | ✅ Exists |
| `BillingAccount`   | Single line of text       | AWS: Billing/Master Account No.    | ❌ Create |
| `AccountName`      | Single line of text       | Account Name / Cloud Checker Name  | ❌ Create |
| `AccountLoginEmail`| Single line of text       | Admin login email for cloud account | ❌ Create |
| `Password`         | Single line of text       | ⚠️ Store securely — consider encrypting or using a separate secure list | ❌ Create |
| `OtherAccountInfo` | Multiple lines of text    | Domain names, additional IDs, etc. | ❌ Create |

### Provisioning & Tracking

| Column Name      | SP Type                   | Notes                              | Status |
|------------------|---------------------------|------------------------------------|--------|
| `CxSRequestNo`   | Single line of text       | e.g. "RN822908/1-2"               | ❌ Create |
| `TID`            | Single line of text       | e.g. "103690"                      | ❌ Create |
| `SDNumber`       | Single line of text       | e.g. "SD11652876"                  | ❌ Create |
| `PSJob`          | Choice                    | Y, N                               | ❌ Create |
| `T2T3`           | Choice                    | T1, T2, T3, N/A                    | ❌ Create |
| `WelcomeLetter`  | Choice                    | Yes, No                            | ❌ Create |
| `By`             | Single line of text       | Staff names, e.g. "Kilson, Helen"  | ❌ Create |
| `OrderFormURL`   | Hyperlink or Picture      | Link to OASIS file                 | ❌ Create |
| `Remark`         | Multiple lines of text    | Timeline, log updates, instructions | ❌ Create |

**Summary: 5 existing columns, 19 new columns to create**

---

## Step 2: Update Power Automate Flow

In the **Order Create Flow** (`Create_item` action), add mappings for all 19 new fields from the HTTP trigger body to the new SharePoint columns.

Fields to add in PA Create_item:
- `ServiceType`, `OasisNumber`, `OrderReceiveDate`, `CxSCompleteDate`
- `ContactPerson`, `ContactNo`, `ContactEmail`, `BillingAddress`
- `BillingAccount`, `AccountName`, `AccountLoginEmail`, `Password`, `OtherAccountInfo`
- `CxSRequestNo`, `TID`, `SDNumber`, `PSJob`, `T2T3`, `WelcomeLetter`, `By`, `OrderFormURL`, `Remark`

---

## Step 3: Update TypeScript Code

### 3a. Update `src/services/orderService.ts`

Add all new fields to `Order` and `CreateOrderInput` interfaces:

```ts
export interface CreateOrderInput {
  Title: string;
  CustomerID?: number;
  CustomerName: string;
  OrderType: string;
  Status: string;
  SRD: string;
  CloudProvider: string;
  Amount: number;
  AccountID?: string;
  // NEW fields:
  ServiceType?: string;
  OasisNumber?: string;
  OrderReceiveDate?: string;
  CxSCompleteDate?: string;
  ContactPerson?: string;
  ContactNo?: string;
  ContactEmail?: string;
  BillingAddress?: string;
  BillingAccount?: string;
  AccountName?: string;
  AccountLoginEmail?: string;
  Password?: string;
  OtherAccountInfo?: string;
  CxSRequestNo?: string;
  TID?: string;
  SDNumber?: string;
  PSJob?: string;
  T2T3?: string;
  WelcomeLetter?: string;
  By?: string;
  OrderFormURL?: string;
  Remark?: string;
}
```

### 3b. Update `src/pages/NewOrder.tsx`

1. Add `useState` for every unwired field (19 new fields)
2. Wire each `InputGroup` / `SelectGroup` / `textarea` with `value` and `onChange`
3. Include all fields in the `orderService.create(...)` call in `handleSave`

### 3c. Update `src/pages/OrderDetails.tsx`

Display all new fields in the order detail view once they are available from the API.

---

## Step 4: Test End-to-End

1. Create a test order with all fields filled
2. Verify SharePoint list item has all values
3. Verify OrderDetails page shows all values

---

## Open Questions / Decisions Needed

- [ ] **Password security**: Should `Password` be stored in the main Orders list, or in a separate secured SharePoint list with restricted permissions?
- [ ] **OrderDetails layout**: How should the new fields be grouped/displayed on the detail page?
