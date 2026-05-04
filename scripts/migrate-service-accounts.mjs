/**
 * Service Account repair script — three independent modes:
 *
 *   FIX_LOOKUP=true        Fix wrong OrderID lookup values on existing SAs.
 *                          Matches SA.Title === Order.Title and updates OrderID
 *                          to the correct SPO item ID.
 *
 *   FILL_MISSING=true      Create SAs for orders that have none yet.
 *                          Reads account data from Excel; creates a minimal SA
 *                          (Title + OrderID) even when account fields are empty.
 *
 *   FILL_EMPTY_FIELDS=true For existing SAs that have blank fields, fill them
 *                          back from Excel data. Only sends fields that are
 *                          currently empty in SPO AND have a value in Excel.
 *
 * Default (no flags set): runs FIX_LOOKUP + FILL_MISSING only.
 *
 * Required .env vars:
 *   VITE_API_SERVICE_ACCOUNTS_URL
 *   VITE_API_ORDERS_URL
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

const SA_URL        = process.env.VITE_API_SERVICE_ACCOUNTS_URL;
const ORDERS_URL    = process.env.VITE_API_ORDERS_URL;
const GET_PAGE_URL  = process.env.VITE_API_GET_PAGE_URL;
const USER_EMAIL    = process.env.MIGRATION_USER_EMAIL || "migration@system";

// If neither FIX/FILL flag is explicitly set, run both defaults.
const RUN_FIX          = process.env.FIX_LOOKUP         !== "false";
const RUN_FILL         = process.env.FILL_MISSING        !== "false";
const RUN_FILL_EMPTY   = process.env.FILL_EMPTY_FIELDS   === "true";

const DRY_RUN     = process.env.DRY_RUN === "true";
const DELAY_MS    = Number(process.env.DELAY_MS ?? 400);

// ── Helpers ──────────────────────────────────────────────────────────────────

function norm(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}
function buildHeaderMap(headers) {
  const map = {};
  for (const h of headers) map[norm(h)] = h;
  return map;
}
function get(row, hm, ...candidates) {
  for (const c of candidates) {
    const key = hm[norm(c)];
    if (key !== undefined && row[key] !== undefined && row[key] !== "")
      return String(row[key]).trim();
  }
  return "";
}

const sleep = (ms = DELAY_MS) => new Promise((r) => setTimeout(r, ms));

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
  return json?.data ?? json;
}

/** Normalise any PA response shape into a plain array */
function extractList(raw) {
  const data = raw?.success === true ? (raw.data ?? raw) : raw;
  if (Array.isArray(data))           return data;
  if (Array.isArray(data?.value))    return data.value;
  if (Array.isArray(data?.d?.results)) return data.d.results;
  return [];
}

function spId(obj) {
  const v = obj?.ID ?? obj?.id ?? obj?.data?.ID ?? obj?.data?.id;
  return v != null ? Number(v) : null;
}

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchWithTimeout(url, body, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAllOrders() {
  console.log("─── Fetching all Orders from SPO… (GET_ALL, timeout: 120s)");
  const res = await fetchWithTimeout(ORDERS_URL, { action: "GET_ALL" }, 120_000);
  if (!res.ok) throw new Error(`Orders GET_ALL failed: ${res.status}`);
  const json = await res.json();
  const items = extractList(json);
  console.log(`   ${items.length} orders loaded`);
  return items;
}

async function fetchAllServiceAccounts() {
  console.log("─── Fetching all Service Accounts from SPO…");
  const raw = await post(SA_URL, { action: "GET_ALL" });
  const items = extractList(raw);
  console.log(`   ${items.length} service accounts loaded`);
  return items;
}

// ── Mode 1: FIX_LOOKUP ────────────────────────────────────────────────────────
// For each SA, find the Order whose Title matches SA.Title.
// If SA.OrderIDId !== order.ID → UPDATE SA.OrderID to the correct ID.

async function fixLookup(orders, serviceAccounts) {
  console.log("\n━━━ FIX_LOOKUP: Correcting OrderID lookup values ━━━━━━━━━━━━━━━");
  if (DRY_RUN) console.log("   [DRY RUN — no writes]\n");

  // Build title → SP item ID from orders
  const orderByTitle = {};
  for (const o of orders) {
    const title = String(o.Title ?? "").trim();
    const id    = spId(o);
    if (title && id) orderByTitle[title] = id;
  }

  let fixed   = 0;
  let already = 0;
  let noMatch = 0;
  const errors = [];

  for (const sa of serviceAccounts) {
    const saTitle      = String(sa.Title ?? "").trim();
    const saSpId       = spId(sa);
    // SP returns lookup ID as OrderIDId on the raw item; our service normalises it to OrderID.
    const currentOrdId = Number(sa.OrderIDId ?? sa.OrderID ?? 0);
    const correctOrdId = orderByTitle[saTitle];

    if (!correctOrdId) {
      noMatch++;
      console.warn(`  ⚠️  No matching Order for SA "${saTitle}" (SA id=${saSpId})`);
      continue;
    }

    if (currentOrdId === correctOrdId) {
      already++;
      continue;
    }

    if (DRY_RUN) {
      fixed++;
      console.log(`  [DRY] SA "${saTitle}" id=${saSpId}: OrderID ${currentOrdId} → ${correctOrdId}`);
      continue;
    }

    try {
      // Preserve all existing SA fields so the PA flow doesn't blank them out.
      const saFields = {};
      for (const f of ["Provider","PrimaryAccountID","SecondaryID","AccountName","Domain","LoginEmail","Password","OtherInfo"]) {
        const v = String(sa[f] ?? "").trim();
        if (v) saFields[f] = v;
      }
      await post(SA_URL, {
        action: "UPDATE",
        userEmail: USER_EMAIL,
        data: { id: saSpId, ...saFields, OrderID: correctOrdId },
      });
      fixed++;
      console.log(`  ✅ SA "${saTitle}" id=${saSpId}: OrderID ${currentOrdId} → ${correctOrdId}`);
    } catch (err) {
      errors.push({ saTitle, saSpId, err: err.message });
      console.error(`  ❌ SA "${saTitle}" id=${saSpId}: ${err.message}`);
    }
    await sleep();
  }

  console.log("\n─── FIX_LOOKUP summary");
  console.log(`   Already correct : ${already}`);
  console.log(`   Fixed           : ${fixed}`);
  console.log(`   No order match  : ${noMatch}`);
  console.log(`   Errors          : ${errors.length}`);
  return errors;
}

// ── Mode 2: FILL_MISSING ──────────────────────────────────────────────────────
// For every order in SPO that has no SA yet, create one.
// Account data comes from the Excel file when available.

async function fillMissing(orders, serviceAccounts) {
  console.log("\n━━━ FILL_MISSING: Creating missing Service Accounts ━━━━━━━━━━━━");
  if (DRY_RUN) console.log("   [DRY RUN — no writes]\n");

  // Load Excel
  const xlsxPath = path.join(__dirname, "../MCdashboard_(Final).xlsx");
  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ Excel file not found: ${xlsxPath}`);
    return [];
  }
  const workbook = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet    = workbook.Sheets["Orders"];
  if (!sheet) {
    console.error('❌ Sheet "Orders" not found in workbook.');
    return [];
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const hm   = buildHeaderMap(Object.keys(rows[0] ?? {}));
  console.log(`   ${rows.length} Excel rows loaded`);

  // Build Excel lookup: service number → row data
  const excelByServiceNo = {};
  for (const row of rows) {
    const sn = get(row, hm, "Service No.", "Service No");
    if (sn) excelByServiceNo[sn] = row;
  }

  // Build SPO maps
  const orderByTitle = {};
  for (const o of orders) {
    const title = String(o.Title ?? "").trim();
    const id    = spId(o);
    if (title && id) orderByTitle[title] = id;
  }

  const existingSaTitles = new Set(
    serviceAccounts.map((sa) => String(sa.Title ?? "").trim())
  );

  // Find orders with no SA
  const missing = Object.entries(orderByTitle).filter(
    ([title]) => !existingSaTitles.has(title)
  );
  console.log(`   Orders with no SA: ${missing.length}\n`);

  let created = 0;
  const errors = [];

  for (const [title, orderId] of missing) {
    const row = excelByServiceNo[title];

    const rawData = {
      Title:            title,
      OrderID:          orderId,
      Provider:         row ? get(row, hm, "Product Subscribe") : "",
      PrimaryAccountID: row ? get(row, hm, "Master-Final", "Billing Account") : "",
      SecondaryID:      row ? get(row, hm, "Account ID") : "",
      AccountName:      row ? get(row, hm, "Account Name", "Account Name / Cloud Checker Name") : "",
      LoginEmail:       row ? get(row, hm, "Account Login Email") : "",
      Password:         row ? get(row, hm, "Password") : "",
      OtherInfo:        row ? get(row, hm, "Other Account Information") : "",
    };
    // Strip empty strings so PA flow doesn't overwrite existing SPO values with blanks.
    const data = Object.fromEntries(
      Object.entries(rawData).filter(([, v]) => v !== "")
    );

    if (DRY_RUN) {
      created++;
      console.log(`  [DRY] Would CREATE SA "${title}" → OrderID ${orderId}`);
      continue;
    }

    try {
      await post(SA_URL, { action: "CREATE", userEmail: USER_EMAIL, data });
      created++;
      console.log(`  ✅ [${created}] "${title}" → OrderID ${orderId}`);
    } catch (err) {
      errors.push({ title, orderId, err: err.message });
      console.error(`  ❌ "${title}": ${err.message}`);
    }
    await sleep();
  }

  console.log("\n─── FILL_MISSING summary");
  console.log(`   Created : ${created}`);
  console.log(`   Errors  : ${errors.length}`);
  return errors;
}

// ── Mode 3: FILL_EMPTY_FIELDS ─────────────────────────────────────────────────
// For every existing SA, compare each field against Excel.
// If the SPO field is blank AND Excel has a value → include it in the UPDATE.
// Fields with existing SPO values are never touched.

async function fillEmptyFields(serviceAccounts) {
  console.log("\n━━━ FILL_EMPTY_FIELDS: Patching blank fields from Excel ━━━━━━━━━");
  if (DRY_RUN) console.log("   [DRY RUN — no writes]\n");

  const xlsxPath = path.join(__dirname, "../MCdashboard_(Final).xlsx");
  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ Excel file not found: ${xlsxPath}`);
    return [];
  }
  const workbook = XLSX.readFile(xlsxPath, { cellDates: true });
  const sheet    = workbook.Sheets["Orders"];
  if (!sheet) {
    console.error('❌ Sheet "Orders" not found in workbook.');
    return [];
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const hm   = buildHeaderMap(Object.keys(rows[0] ?? {}));
  console.log(`   ${rows.length} Excel rows loaded`);

  const excelByServiceNo = {};
  for (const row of rows) {
    const sn = get(row, hm, "Service No.", "Service No");
    if (sn) excelByServiceNo[sn] = row;
  }

  // Field definitions: SPO field name → Excel column candidates
  const FIELD_MAP = [
    { field: "Provider",         cols: ["Product Subscribe"] },
    { field: "PrimaryAccountID", cols: ["Master-Final", "Billing Account"] },
    { field: "SecondaryID",      cols: ["Account ID"] },
    { field: "AccountName",      cols: ["Account Name", "Account Name / Cloud Checker Name"] },
    { field: "LoginEmail",       cols: ["Account Login Email"] },
    { field: "Password",         cols: ["Password"] },
    { field: "OtherInfo",        cols: ["Other Account Information"] },
  ];

  let patched   = 0;
  let skipped   = 0;
  let noExcel   = 0;
  const errors  = [];

  for (const sa of serviceAccounts) {
    const saTitle = String(sa.Title ?? "").trim();
    const saSpId  = spId(sa);
    const row     = excelByServiceNo[saTitle];

    if (!row) {
      noExcel++;
      continue;
    }

    // Build patch: only fields that are blank in SPO and have a value in Excel
    const patch = {};
    for (const { field, cols } of FIELD_MAP) {
      const spoVal   = String(sa[field] ?? "").trim();
      const excelVal = get(row, hm, ...cols);
      if (!spoVal && excelVal) patch[field] = excelVal;
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      patched++;
      console.log(`  [DRY] SA "${saTitle}" id=${saSpId} — patch: ${JSON.stringify(patch)}`);
      continue;
    }

    try {
      // Include all existing non-empty SA fields to protect against PA flow blanking them.
      const existing = {};
      for (const { field } of FIELD_MAP) {
        const v = String(sa[field] ?? "").trim();
        if (v) existing[field] = v;
      }
      await post(SA_URL, {
        action: "UPDATE",
        userEmail: USER_EMAIL,
        data: { id: saSpId, ...existing, ...patch },
      });
      patched++;
      console.log(`  ✅ [${patched}] "${saTitle}" id=${saSpId} — filled: ${Object.keys(patch).join(", ")}`);
    } catch (err) {
      errors.push({ saTitle, saSpId, patch, err: err.message });
      console.error(`  ❌ "${saTitle}" id=${saSpId}: ${err.message}`);
    }
    await sleep();
  }

  console.log("\n─── FILL_EMPTY_FIELDS summary");
  console.log(`   Patched         : ${patched}`);
  console.log(`   Already full    : ${skipped}`);
  console.log(`   No Excel match  : ${noExcel}`);
  console.log(`   Errors          : ${errors.length}`);
  return errors;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const missing = [];
  if (!SA_URL)     missing.push("VITE_API_SERVICE_ACCOUNTS_URL");
  if (!ORDERS_URL) missing.push("VITE_API_ORDERS_URL");
  if (missing.length) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  if (!RUN_FIX && !RUN_FILL && !RUN_FILL_EMPTY) {
    console.error("❌ No mode enabled — set at least one of FIX_LOOKUP, FILL_MISSING, FILL_EMPTY_FIELDS.");
    process.exit(1);
  }

  console.log("━━━ Service Account Repair Script ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`   FIX_LOOKUP        : ${RUN_FIX}`);
  console.log(`   FILL_MISSING      : ${RUN_FILL}`);
  console.log(`   FILL_EMPTY_FIELDS : ${RUN_FILL_EMPTY}`);
  console.log(`   DRY_RUN           : ${DRY_RUN}`);
  console.log(`   DELAY_MS          : ${DELAY_MS}ms\n`);

  const needsOrders = RUN_FIX || RUN_FILL;
  const orders = needsOrders ? await fetchAllOrders() : [];
  if (needsOrders) await sleep(1000);
  const serviceAccounts = await fetchAllServiceAccounts();

  const allErrors = [];

  if (RUN_FIX) {
    const errs = await fixLookup(orders, serviceAccounts);
    allErrors.push(...errs);
  }

  if (RUN_FILL) {
    const errs = await fillMissing(orders, serviceAccounts);
    allErrors.push(...errs);
  }

  if (RUN_FILL_EMPTY) {
    const errs = await fillEmptyFields(serviceAccounts);
    allErrors.push(...errs);
  }

  console.log("\n━━━ ALL DONE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  if (allErrors.length) {
    const logPath = path.join(__dirname, `sa-repair-errors-${Date.now()}.json`);
    fs.writeFileSync(logPath, JSON.stringify(allErrors, null, 2));
    console.log(`⚠️  ${allErrors.length} error(s) — details: ${logPath}`);
  } else {
    console.log("✅ No errors.");
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err);
  process.exit(1);
});
