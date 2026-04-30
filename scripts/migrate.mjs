/**
 * One-time migration script: MCDashboard.xlsx → SharePoint via Power Automate
 *
 * Usage:
 *   1. Copy .env to project root with the 4 vars below
 *   2. node scripts/migrate.mjs
 *
 * Required .env vars:
 *   VITE_API_CUSTOMERS_URL
 *   VITE_API_ORDERS_URL
 *   VITE_API_SERVICE_ACCOUNTS_URL
 *   MIGRATION_USER_EMAIL
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const CUSTOMERS_URL = process.env.VITE_API_CUSTOMERS_URL;
const ORDERS_URL = process.env.VITE_API_ORDERS_URL;
const SA_URL = process.env.VITE_API_SERVICE_ACCOUNTS_URL;
const USER_EMAIL = process.env.MIGRATION_USER_EMAIL || "migration@system";
const MAX_ROWS = process.env.MAX_ROWS ? Number(process.env.MAX_ROWS) : null;
// START_ROW is the Excel row number (2 = first data row). Rows before it are skipped.
const START_ROW = process.env.START_ROW ? Number(process.env.START_ROW) : 2;
// PATCH_MISSING=true: skip all CREATE passes, only fill missing fields on existing SPO records.
const PATCH_MISSING = process.env.PATCH_MISSING === "true";
const GET_PAGE_URL = process.env.VITE_API_GET_PAGE_URL;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalise a header string: collapse all whitespace/newlines to single space */
function norm(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Build map: normalised header → original header key in the row object */
function buildHeaderMap(headers) {
  const map = {};
  for (const h of headers) map[norm(h)] = h;
  return map;
}

/** Get a cell value (as string) by trying multiple candidate header names */
function get(row, hm, ...candidates) {
  for (const c of candidates) {
    const key = hm[norm(c)];
    if (key !== undefined && row[key] !== undefined && row[key] !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

/** Get raw cell value (for dates which may be Date objects) */
function getRaw(row, hm, ...candidates) {
  for (const c of candidates) {
    const key = hm[norm(c)];
    if (key !== undefined && row[key] !== undefined && row[key] !== "") {
      return row[key];
    }
  }
  return null;
}

/** Format a date value to YYYY-MM-DD string, or null if invalid/empty */
function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return val.toISOString().split("T")[0];
  }
  const str = String(val).trim();
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
}

/** POST to a PA endpoint, return the created item */
async function post(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json?.success === false) throw new Error(json.error?.message ?? "API error");
  // Normalise: return the data object regardless of envelope shape
  const data = json?.data ?? json;
  return data;
}

/** Delay to avoid PA flow throttling (default 400 ms between calls) */
const sleep = (ms = 400) => new Promise((r) => setTimeout(r, ms));

/** Extract numeric SPO ID from a response object */
function extractId(obj) {
  const id = obj?.ID ?? obj?.id ?? obj?.data?.ID ?? obj?.data?.id;
  return id != null ? Number(id) : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate env vars
  const missing = [];
  if (!CUSTOMERS_URL) missing.push("VITE_API_CUSTOMERS_URL");
  if (!ORDERS_URL) missing.push("VITE_API_ORDERS_URL");
  if (!SA_URL) missing.push("VITE_API_SERVICE_ACCOUNTS_URL");
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    console.error("   Add them to .env in the project root.");
    process.exit(1);
  }

  // Load Excel
  const xlsxPath = path.join(__dirname, "../MCdashboard_(Final).xlsx");
  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ File not found: ${xlsxPath}`);
    process.exit(1);
  }
  console.log(`📂 Reading ${xlsxPath}`);

  const workbook = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet = workbook.Sheets["Orders"];
  if (!sheet) {
    console.error('❌ "Orders" not found in workbook.');
    console.error(`   Available sheets: ${workbook.SheetNames.join(", ")}`);
    process.exit(1);
  }

  let rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (rows.length === 0) {
    console.error("❌ Sheet1 has no rows.");
    process.exit(1);
  }
  // START_ROW: Excel row 2 = index 0. Slice off rows before the start row.
  const startIndex = Math.max(0, START_ROW - 2);
  if (startIndex > 0) {
    rows = rows.slice(startIndex);
    console.log(`⏭️  Skipping to Excel row ${START_ROW} (index ${startIndex})`);
  }
  if (MAX_ROWS) {
    rows = rows.slice(0, MAX_ROWS);
    console.log(`📊 ${rows.length} rows (TEST MODE: MAX_ROWS=${MAX_ROWS})\n`);
  } else {
    console.log(`📊 ${rows.length} rows found\n`);
  }

  // Build header map
  const hm = buildHeaderMap(Object.keys(rows[0]));

  // Debug: print detected headers
  console.log("📋 Detected headers (normalised):");
  Object.keys(hm).forEach((k) => console.log(`   "${k}"`));
  console.log();

  // ── PATCH MODE ─────────────────────────────────────────────────────────────
  // Skips all CREATE passes. Fetches existing SPO records by Title, then
  // patches: PreviousName on customers, OrderType/ContactPerson/ContactPerson2 on orders.
  if (PATCH_MISSING) {
    console.log("━━━ PATCH MODE: Filling missing fields ━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   Customers  → PreviousName");
    console.log("   Orders     → OrderType, ContactPerson, ContactPerson2\n");

    // Helper: extract item array from any PA response shape
    function extractList(raw) {
      const data = raw?.success === true ? (raw.data ?? raw) : raw;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.value)) return data.value;
      if (Array.isArray(data?.d?.results)) return data.d.results;
      return [];
    }

    // 1. Fetch all customers
    console.log("─── Fetching existing customers…");
    const custRaw = await post(CUSTOMERS_URL, { action: "GET_ALL" });
    const custItems = extractList(custRaw);
    const customerIdMap = {};
    for (const c of custItems) {
      const id = Number(c.ID ?? c.id ?? 0);
      const title = String(c.Title ?? c.Company ?? "").toLowerCase();
      if (id && title) customerIdMap[title] = id;
    }
    console.log(`   ${custItems.length} customers loaded\n`);

    // 2. Fetch all orders (paginated via GET_PAGE, fallback to GET_ALL)
    console.log("─── Fetching existing orders…");
    const allOrders = [];
    if (GET_PAGE_URL) {
      let offset = 0;
      const limit = 500;
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(GET_PAGE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "GET_PAGE", limit, offset }),
        });
        if (!res.ok) throw new Error(`GET_PAGE failed: ${res.status}`);
        const json = await res.json();
        const items = extractList(json);
        allOrders.push(...items);
        if (items.length < limit) break;
        offset += limit;
        // eslint-disable-next-line no-await-in-loop
        await sleep(200);
      }
    } else {
      console.warn("   ⚠️  VITE_API_GET_PAGE_URL not set — using GET_ALL (may be limited to 100)");
      const ordRaw = await post(ORDERS_URL, { action: "GET_ALL" });
      allOrders.push(...extractList(ordRaw));
    }
    const orderIdByTitle = {};
    for (const o of allOrders) {
      const id = Number(o.ID ?? o.id ?? 0);
      const title = String(o.Title ?? "");
      if (id && title) orderIdByTitle[title] = id;
    }
    console.log(`   ${allOrders.length} orders loaded\n`);

    const mappedOrders = rows.filter((r) => {
      const sn = get(r, hm, "Service No.", "Service No");
      return sn && orderIdByTitle[sn];
    }).length;
    if (mappedOrders < rows.length * 0.8)
      console.warn(`   ⚠️  Only mapped ${mappedOrders}/${rows.length} rows — check GET_PAGE_URL\n`);

    // 3. Patch loop
    console.log("─── Patching…");
    let customerPatched = 0;
    let orderPatched = 0;
    const seenPatch = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNo = i + 2;
      const company = get(row, hm, "Standardized Company Name", "Company Name");
      const serviceNo = get(row, hm, "Service No.", "Service No");

      // Customer patch — once per unique company
      if (company && !seenPatch.has(company.toLowerCase())) {
        seenPatch.add(company.toLowerCase());
        const previousName = get(row, hm, "Previous Name");
        const custId = customerIdMap[company.toLowerCase()];
        if (custId && previousName) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await post(CUSTOMERS_URL, {
              action: "UPDATE",
              userEmail: USER_EMAIL,
              data: { id: custId, PreviousName: previousName },
            });
            customerPatched++;
            console.log(`  ✅ Customer [${custId}] ${company} → PreviousName: ${previousName}`);
          } catch (err) {
            console.error(`  ❌ Customer patch failed (row ${rowNo}): ${company} — ${err.message}`);
          }
          // eslint-disable-next-line no-await-in-loop
          await sleep();
        }
      }

      // Order patch
      if (serviceNo) {
        const ordId = orderIdByTitle[serviceNo];
        const orderType = get(row, hm, "Order Type");
        const contactPerson = get(row, hm, "Contact Person");
        const contactPerson2 = get(row, hm, "Contact Person 2");

        if (ordId && (orderType || contactPerson || contactPerson2)) {
          const data = { id: ordId };
          if (orderType) data.OrderType = orderType;
          if (contactPerson) data.ContactPerson = contactPerson;
          if (contactPerson2) data.ContactPerson2 = contactPerson2;

          try {
            // eslint-disable-next-line no-await-in-loop
            await post(ORDERS_URL, { action: "UPDATE", userEmail: USER_EMAIL, data });
            orderPatched++;
            console.log(`  ✅ Order [${ordId}] ${serviceNo} → patched`);
          } catch (err) {
            console.error(`  ❌ Order patch failed (row ${rowNo}): ${serviceNo} — ${err.message}`);
          }
          // eslint-disable-next-line no-await-in-loop
          await sleep();
        }
      }
    }

    console.log("\n━━━ PATCH COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`✅ Customers patched: ${customerPatched}`);
    console.log(`✅ Orders patched:    ${orderPatched}`);
    return;
  }
  // ── end PATCH MODE ──────────────────────────────────────────────────────────

  const skipped = []; // { row, reason }
  const customerMap = {}; // companyName → SPO customer ID
  const orderIdMap = {}; // row index → SPO order ID

  let customersCreated = 0;
  let ordersCreated = 0;
  let saCreated = 0;

  // ── PASS 1: Customers ────────────────────────────────────────────────────
  console.log("━━━ PASS 1: Customers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  const seenCompanies = new Set();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 2; // Excel row number (1 = header)
    const company = get(row, hm, "Standardized Company Name", "Company Name");

    if (!company) {
      skipped.push({ row: rowNo, reason: "Empty Company Name" });
      continue;
    }
    if (seenCompanies.has(company.toLowerCase())) continue;
    seenCompanies.add(company.toLowerCase());

    try {
      const result = await post(CUSTOMERS_URL, {
        action: "CREATE",
        userEmail: USER_EMAIL,
        data: {
          Title: company,
          Company: company,
          Email: get(row, hm, "Contact Email 1", "Contact Email", "Contact Email (If have)"),
          Phone: get(row, hm, "Contact Number 1", "Contact Number", "Contact Number (If have)"),
          ContactPerson: get(row, hm, "Contact Person 1", "Contact Person"),
          BillingAddress: get(row, hm, "Billing Address"),
          PreviousName: get(row, hm, "Previous Name"),
          Status: "Active",
          Tier: "Standard",
        },
      });
      const id = extractId(result);
      customerMap[company.toLowerCase()] = id;
      customersCreated++;
      console.log(`  ✅ [${customersCreated}] ${company} → ID ${id}`);
    } catch (err) {
      console.error(`  ❌ Customer failed (row ${rowNo}): ${company} — ${err.message}`);
      skipped.push({ row: rowNo, reason: `Customer: ${err.message}` });
    }
    await sleep();
  }

  // ── PASS 2: Orders ───────────────────────────────────────────────────────
  console.log("\n━━━ PASS 2: Orders ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 2;
    const serviceNo = get(row, hm, "Service No.", "Service No");
    const company = get(row, hm, "Standardized Company Name", "Company Name");

    if (!serviceNo) {
      skipped.push({ row: rowNo, reason: "Empty Service No. — skipped order" });
      continue;
    }

    try {
      const result = await post(ORDERS_URL, {
        action: "CREATE",
        userEmail: USER_EMAIL,
        data: {
          Title: serviceNo,
          CustomerID: customerMap[company.toLowerCase()] ?? null,
          CustomerName: company,
          Status: get(row, hm, "Status") || "Active",
          OrderType: get(row, hm, "Order Type"),
          ServiceType: get(row, hm, "Service Type"),
          SRD: formatDate(getRaw(row, hm, "SRD")) || "",
          CloudProvider: get(row, hm, "Product Subscribe"),
          Amount: 0,
          OrderReceiveDate: formatDate(getRaw(row, hm, "Order Receive Date")) || "",
          CxSCompleteDate: formatDate(getRaw(row, hm, "CxS Complete Date")) || "",
          ContactPerson: get(row, hm, "Contact Person 1", "Contact Person"),
          ContactPerson2: get(row, hm, "Contact Person 2"),
          ContactNo: get(row, hm, "Contact Number 1", "Contact Number", "Contact Number (If have)"),
          ContactNo2: get(row, hm, "Contact Number 2"),
          ContactEmail: get(row, hm, "Contact Email 1", "Contact Email", "Contact Email (If have)"),
          ContactEmail2: get(row, hm, "Contact Email 2"),
          BillingAddress: get(row, hm, "Billing Address"),
          SubName: get(row, hm, "Project Name"),
          CxSRequestNo: get(row, hm, "CxS Request No.", "CxS Request No"),
          TID: get(row, hm, "TID"),
          OasisNumber: get(row, hm, "OASIS Number"),
          SDNumber: get(row, hm, "SD Number"),
          Remark: get(row, hm, "Remark"),
          PSJob: get(row, hm, "PS Job (Y/N)", "PS Job"),
          T2T3: get(row, hm, "T2/ T3", "T2/T3", "T2 T3"),
          WelcomeLetter: get(row, hm, "Welcome Letter (Yes / No)", "Welcome Letter"),
          By: get(row, hm, "By"),
          OrderFormURL: get(row, hm, "Order Form"),
          AccountID: get(row, hm, "Account ID"),
          AccountName: get(row, hm, "Account Name", "Account Name / Cloud Checker Name"),
          BillingAccount: get(row, hm, "Master-Final", "Billing Account"),
          AccountLoginEmail: get(row, hm, "Account Login Email"),
          OtherAccountInfo: get(row, hm, "Other Account Information"),
        },
      });
      const id = extractId(result);
      orderIdMap[i] = id;
      ordersCreated++;
      console.log(`  ✅ [${ordersCreated}] ${serviceNo} → ID ${id}`);
    } catch (err) {
      console.error(`  ❌ Order failed (row ${rowNo}): ${serviceNo} — ${err.message}`);
      skipped.push({ row: rowNo, reason: `Order: ${err.message}` });
    }
    await sleep();
  }

  // ── PASS 3: Service Accounts ─────────────────────────────────────────────
  console.log("\n━━━ PASS 3: Service Accounts ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 2;
    const loginEmail = get(row, hm, "Account Login Email");
    const accountName = get(row, hm, "Account Name");

    // Skip rows with no service account data
    if (!loginEmail && !accountName) continue;

    const orderId = orderIdMap[i];
    if (!orderId) continue; // order wasn't created — skip SA too

    const serviceNo = get(row, hm, "Service No.", "Service No");

    try {
      await post(SA_URL, {
        action: "CREATE",
        userEmail: USER_EMAIL,
        data: {
          Title: serviceNo || `SA-Row${rowNo}`,
          OrderID: orderId,
          Provider: get(row, hm, "Product Subscribe"),
          PrimaryAccountID: get(row, hm, "Master-Final"),
          SecondaryID: get(row, hm, "Account ID"),
          AccountName: accountName,
          LoginEmail: loginEmail,
          Password: get(row, hm, "Password"),
          OtherInfo: get(row, hm, "Other Account Information"),
        },
      });
      saCreated++;
      console.log(`  ✅ [${saCreated}] row ${rowNo} → Order ID ${orderId}`);
    } catch (err) {
      console.error(`  ❌ ServiceAccount failed (row ${rowNo}): ${err.message}`);
      skipped.push({ row: rowNo, reason: `ServiceAccount: ${err.message}` });
    }
    await sleep();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n━━━ MIGRATION COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Customers created:       ${customersCreated}`);
  console.log(`✅ Orders created:          ${ordersCreated}`);
  console.log(`✅ Service Accounts created:${saCreated}`);
  console.log(`⚠️  Rows skipped:           ${skipped.length}`);

  if (skipped.length > 0) {
    const logPath = path.join(__dirname, "skipped.log");
    const lines = skipped
      .map((s) => `Row ${s.row}: ${s.reason}`)
      .join("\n");
    fs.writeFileSync(logPath, lines + "\n");
    console.log(`\n📄 Skipped rows → ${logPath}`);
    console.log("   Review and handle manually.");
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
