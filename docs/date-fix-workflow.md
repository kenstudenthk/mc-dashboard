# SPO Date Correction Workflow

**Problem**: SPO List dates (SRD, OrderReceiveDate, CxCompleteDate) are 1 day behind the correct values.  
**Solution**: Script-based adjustment + PA Flow batch update.

## Step 1: Export SPO List Data

1. Go to SharePoint List
2. Click **Export to Excel** (or manually copy the columns into CSV)
3. Save as `spo-export.csv` in the `scripts/` folder
4. Ensure the CSV includes:
   - ID (required for PA update)
   - SRD
   - OrderReceiveDate
   - CxCompleteDate
   - Any other columns needed for matching/updating

**CSV Format Example:**
```
ID,Title,SRD,OrderReceiveDate,CxCompleteDate,CloudProvider
1,Order-001,2025-04-30,2025-04-30,2025-04-30,AWS
2,Order-002,2025-05-01,2025-05-01,2025-05-01,Azure
```

## Step 2: Run Date Adjuster Script

```bash
cd scripts
node date-adjuster.js --input spo-export.csv --output corrected-dates.csv
```

**Output**: `corrected-dates.csv` with all dates +1 day
```
ID,Title,SRD,OrderReceiveDate,CxCompleteDate,CloudProvider
1,Order-001,2025-05-01,2025-05-01,2025-05-01,AWS
2,Order-002,2025-05-02,2025-05-02,2025-05-02,Azure
```

## Step 3: Create PA Flow for Batch Update

### Option A: Simple (Recommended for <100 rows)

**Flow trigger**: Manual (button)

**Steps:**

1. **Upload corrected CSV**
   - Action: `Parse CSV`
   - Input: `corrected-dates.csv`

2. **Apply to each row**
   - For each row in parsed CSV:
     - Action: `Update item` (SharePoint)
     - Site: Your SharePoint site
     - List: Target list
     - ID: `@{items('Apply_to_each')?['ID']}`
     - Fields:
       - `SRD`: `@{items('Apply_to_each')?['SRD']}`
       - `OrderReceiveDate`: `@{items('Apply_to_each')?['OrderReceiveDate']}`
       - `CxCompleteDate`: `@{items('Apply_to_each')?['CxCompleteDate']}`

3. **Notification (optional)**
   - Send success email when complete

### Option B: Advanced (Better for >100 rows)

Use **Concurrency Control** in the "Apply to each":
- Set `Degree of Parallelism` to 5-10 (parallel updates)
- Faster processing for large datasets

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid date" warning in script | Check CSV date format is `YYYY-MM-DD` |
| PA flow fails to update | Verify column names match exactly (case-sensitive) |
| SPO shows old dates after update | Check PA flow "Update item" uses correct field names |
| CSV parsing fails in PA | Ensure no extra commas in data; use quotes for text with commas |

---

## Backup Before Running

⚠️ **Always back up your SPO List before bulk updates:**

```bash
# Export current SPO data as backup
# Via SharePoint: Site Settings → Manage Lists → Export List
```

---

## Verify After Update

1. Open SPO List
2. Check one sample row:
   - Original SRD: `2025-04-30`
   - After update: `2025-05-01` ✓

3. Run script again with updated list (should show no changes):
   ```bash
   node date-adjuster.js --input spo-export-v2.csv --output corrected-dates-v2.csv
   ```
   If all dates remain same, correction was successful ✓

---

## Next Time (Prevention)

To avoid this in future imports:
- Fix dates **before** uploading to SPO
- Or use PA flow calculated column: `addDays(SRD_TextValue, 1)`
