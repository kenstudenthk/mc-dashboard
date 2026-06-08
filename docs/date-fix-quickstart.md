# 🚀 SPO Date Fix - Quick Start

## Your Situation
- **SPO dates**: 1 day behind (例: 2025-04-30)
- **Correct dates**: Should be +1 day (2025-05-01)
- **Your columns**: SRD, OrderReceiveDate, CxSCompleteDate (all Single Line Text)

---

## 2-Step Fix Using Your UPDATE Order Flow

### 1️⃣ Export SPO Data + Run Script
```bash
# 1. Export from SharePoint → spo-export.csv
# 2. Place CSV in scripts/ folder

# 3. Run correction script
cd scripts
node date-adjuster.js --input spo-export.csv --output batch-update.json --email kk1214@kkhome.uk
```

**Input CSV columns needed:**
- `Id` (required for update)
- `SRD`
- `OrderReceiveDate`
- `CxSCompleteDate`
- (any other fields you want to preserve)

**Output**: `batch-update.json` formatted for UPDATE order flow

Example output structure:
```json
{
  "timestamp": "2025-06-08T10:30:00.000Z",
  "totalRecords": 5,
  "userEmail": "kk1214@kkhome.uk",
  "requests": [
    {
      "action": "update",
      "userEmail": "kk1214@kkhome.uk",
      "data": {
        "Id": "1",
        "SRD": "2025-05-01",
        "OrderReceiveDate": "2025-05-01",
        "CxSCompleteDate": "2025-05-01",
        "Title": "Order-001",
        ...
      }
    },
    ...
  ]
}
```

### 2️⃣ Use Your UPDATE Order Flow in PA

In Power Automate, create a simple trigger flow:

**Trigger**: Manual

**Steps**:
1. **Initialize variable**: `batchData` = paste contents of `batch-update.json`
2. **Parse JSON**: Parse the batch-update.json content
3. **Apply to each**: For each item in `requests`:
   - **Call your UPDATE order flow** (HTTP or Flow action):
     - Body:
       ```
       {
         "action": "update",
         "userEmail": "@{items('Apply_to_each')?['userEmail']}",
         "data": @{items('Apply_to_each')?['data']}
       }
       ```

**That's it!** Your existing UPDATE order flow handles the rest.

---

## What Happens

| Stage | Input | Output |
|-------|-------|--------|
| **SPO Export** | Live SPO List | spo-export.csv |
| **Script** | spo-export.csv | batch-update.json (dates +1 day) |
| **PA Flow** | batch-update.json | Calls UPDATE order flow for each record |
| **UPDATE Order Flow** | Each request | ✅ SPO List updated |

---

## Verification

After flow completes:

1. Open SPO List
2. Pick any row
3. Verify SRD, OrderReceiveDate, CxSCompleteDate all +1 day ✓

---

## Troubleshoot

| Problem | Solution |
|---------|----------|
| Script error: "Missing required columns" | CSV must include: `Id`, `SRD`, `OrderReceiveDate`, `CxSCompleteDate` |
| Script error: "Invalid date" | Check CSV dates are exactly `YYYY-MM-DD` format |
| PA flow can't parse JSON | Copy entire batch-update.json contents (pretty-printed) |
| UPDATE order flow returns error | Check userEmail matches a valid SharePoint user |

---

## Command Reference

```bash
# Full syntax
node date-adjuster.js \
  --input spo-export.csv \
  --output batch-update.json \
  --email kk1214@kkhome.uk
```

---

## Files Created for You

```
scripts/
  └─ date-adjuster.js          ← Run this with your CSV

docs/
  ├─ date-fix-workflow.md      ← Full documentation
  └─ date-fix-quickstart.md    ← This file
```

---

## Next: Run It

1. Export SPO List → `spo-export.csv`
2. Save to `scripts/` folder
3. Run: `node date-adjuster.js --input spo-export.csv --output batch-update.json --email kk1214@kkhome.uk`
4. Copy JSON output → Paste into your PA flow
5. Run flow

Done! 🎉
