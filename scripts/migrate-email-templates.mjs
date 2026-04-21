/**
 * One-time migration: email_template.xlsx Sheet1 → SharePoint via Power Automate
 *
 * Usage:
 *   node scripts/migrate-email-templates.mjs            # dry-run (no writes)
 *   node scripts/migrate-email-templates.mjs --commit   # live POST
 *
 * Required env (in .env.local or .env at project root):
 *   VITE_API_EMAIL_TEMPLATES_URL
 *   MIGRATION_USER_EMAIL  (optional, defaults to "migration@system")
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx");
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env.local") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_URL = process.env.VITE_API_EMAIL_TEMPLATES_URL;
const USER_EMAIL = process.env.MIGRATION_USER_EMAIL || "migration@system";
const COMMIT = process.argv.includes("--commit");

// ── Token normalisation map ───────────────────────────────────────────────────
// Maps legacy [Token Name] / bare token text → canonical {{CamelCase}} var name.
const TOKEN_MAP = {
  "Customer Name": "CustomerName",
  CustomerName: "CustomerName",
  CompanyName: "CustomerName",

  UID: "AccountID",
  "AWS ID": "AccountID",
  "AWS Account ID": "AccountID",
  "Account ID": "AccountID",
  AccountID: "AccountID",

  "Tenant ID (TID)": "TenantID",
  "Tenant ID": "TenantID",
  TID: "TenantID",

  "Microsoft ID": "MicrosoftID",
  MicrosoftID: "MicrosoftID",

  "Azure Subscription ID": "AzureSubscriptionID",
  AzureSubscriptionID: "AzureSubscriptionID",

  "AM Email": "AMEmail",
  AM: "AMEmail",
  AMEmail: "AMEmail",

  "ASM Email": "ASMEmail",
  ASM: "ASMEmail",
  ASMEmail: "ASMEmail",

  "Service Number": "ServiceNumber",
  ServiceNumber: "ServiceNumber",

  "Register or Admin Email": "AdminEmail",
  "Admin Email": "AdminEmail",
  AdminEmail: "AdminEmail",

  "Customer Contact Email": "ContactEmail",
  "Contact Email": "ContactEmail",
  CustomerEmail: "ContactEmail",
  ContactEmail: "ContactEmail",

  "Service Desk no.": "ServiceDeskNo",
  "Service Desk No": "ServiceDeskNo",
  SD: "ServiceDeskNo",
  SDNo: "ServiceDeskNo",
  ServiceDeskNo: "ServiceDeskNo",

  "Invitation URL": "InvitationURL",
  InvitationURL: "InvitationURL",

  "Order Title": "OrderTitle",
  OrderTitle: "OrderTitle",
  "Sub Name": "SubName",
  SubName: "SubName",
  "Service Type": "ServiceType",
  ServiceType: "ServiceType",
  "Cloud Provider": "CloudProvider",
  CloudProvider: "CloudProvider",
  "Contact Person": "ContactPerson",
  ContactPerson: "ContactPerson",
  SRD: "SRD",
  Amount: "Amount",
  "Oasis Number": "OasisNumber",
  OasisNumber: "OasisNumber",
  "Account Name": "AccountName",
  AccountName: "AccountName",
  "Billing Address": "BillingAddress",
  BillingAddress: "BillingAddress",
  "Login Email": "LoginEmail",
  LoginEmail: "LoginEmail",
};

// ── Service type normalisation ───────────────────────────────────────────────
const SERVICE_MAP = {
  "alibaba cloud": "Alibaba",
  alibaba: "Alibaba",
  "microsoft azure": "Azure",
  azure: "Azure",
  "google cloud platform": "GCP",
  gcp: "GCP",
  "huawei cloud": "Huawei",
  huawei: "Huawei",
  aws: "AWS",
  tencent: "Tencent",
  general: "General",
};

const VALID_CATEGORIES = new Set([
  "Welcome Letter",
  "Order Confirmation",
  "Account Created",
  "Closure Notice",
  "Status Update",
  "General",
]);

const CATEGORY_MAP = {
  "welcome letter": "Welcome Letter",
  welcome: "Welcome Letter",
  "order confirmation": "Order Confirmation",
  confirmation: "Order Confirmation",
  "account created": "Account Created",
  "account creation": "Account Created",
  "closure notice": "Closure Notice",
  closure: "Closure Notice",
  "status update": "Status Update",
  status: "Status Update",
  general: "General",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function norm(s) {
  return String(s ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function buildHeaderMap(headers) {
  const map = {};
  for (const h of headers) map[norm(h)] = h;
  return map;
}

function get(row, hm, ...candidates) {
  for (const c of candidates) {
    const key = hm[norm(c)];
    if (key !== undefined && row[key] !== undefined && row[key] !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

/**
 * Replace [Token Name] and {{TokenName}} patterns using TOKEN_MAP.
 * Unknown tokens are left as-is and collected in the warnings array.
 */
function normalizeTokens(text, warnings) {
  if (!text) return text;

  // Replace [Token Name] and [#Token Name] patterns
  let result = text.replace(/\[([^\]]+)\]/g, (match, inner) => {
    const key = inner.trim().replace(/^#/, "");
    if (TOKEN_MAP[key]) return `{{${TOKEN_MAP[key]}}}`;
    // Try case-insensitive lookup
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(TOKEN_MAP)) {
      if (k.toLowerCase() === lower) return `{{${v}}}`;
    }
    warnings.push(`Unresolved token: [${key}]`);
    return match;
  });

  // Normalize already-{{bracketed}} tokens that may use old names
  result = result.replace(/\{\{([^}]+)\}\}/g, (match, inner) => {
    const key = inner.trim();
    if (TOKEN_MAP[key]) return `{{${TOKEN_MAP[key]}}}`;
    return match;
  });

  return result;
}

function normalizeService(raw) {
  const mapped = SERVICE_MAP[norm(raw)];
  if (mapped) return mapped;
  // Preserve as-is if it already matches a valid value
  const valid = ["AWS", "Azure", "GCP", "Alibaba", "Huawei", "Tencent", "General"];
  if (valid.includes(raw)) return raw;
  return null;
}

function normalizeCategory(raw) {
  const mapped = CATEGORY_MAP[norm(raw)];
  if (mapped) return mapped;
  if (VALID_CATEGORIES.has(raw)) return raw;
  return null;
}

/** Parse semicolon/comma-separated variable list from "Necessary Input Data" */
function parseVariableList(raw, warnings) {
  if (!raw) return "";
  // Strip leading # (Excel uses "#Token Name" as required-field markers)
  const parts = raw.split(/[;,]/).map((s) => s.trim().replace(/^#/, "")).filter(Boolean);
  const canonical = parts.map((part) => {
    if (TOKEN_MAP[part]) return TOKEN_MAP[part];
    const lower = part.toLowerCase();
    for (const [k, v] of Object.entries(TOKEN_MAP)) {
      if (k.toLowerCase() === lower) return v;
    }
    warnings.push(`Unknown variable in list: "${part}"`);
    return part;
  });
  return [...new Set(canonical)].join("; ");
}

async function postApi(body) {
  const res = await fetch(API_URL, {
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

const sleep = (ms = 300) => new Promise((r) => setTimeout(r, ms));

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (COMMIT && !API_URL) {
    console.error("❌ VITE_API_EMAIL_TEMPLATES_URL is not set.");
    console.error("   Add it to .env.local or .env in the project root.");
    process.exit(1);
  }

  const xlsxPath = path.join(__dirname, "../email_template.xlsx");
  if (!fs.existsSync(xlsxPath)) {
    console.error(`❌ File not found: ${xlsxPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading ${xlsxPath}`);
  const workbook = XLSX.readFile(xlsxPath, { cellDates: false });

  // Sheet1 has the legacy templates
  const sheet = workbook.Sheets["Sheet1"];
  if (!sheet) {
    console.error(`❌ "Sheet1" not found. Available: ${workbook.SheetNames.join(", ")}`);
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (rows.length === 0) {
    console.error("❌ Sheet1 is empty.");
    process.exit(1);
  }

  console.log(`📊 ${rows.length} rows found in Sheet1`);
  console.log(COMMIT ? "🚀 COMMIT mode — templates will be POSTed\n" : "🔍 DRY-RUN mode — no writes (pass --commit to apply)\n");

  const hm = buildHeaderMap(Object.keys(rows[0]));

  console.log("📋 Detected columns:");
  Object.keys(hm).forEach((k) => console.log(`   "${k}"`));
  console.log();

  // Fetch existing templates for idempotency check (only in commit mode)
  let existing = [];
  if (COMMIT) {
    console.log("🔍 Fetching existing templates for idempotency check...");
    try {
      const result = await postApi({ action: "GET_ALL" });
      existing = Array.isArray(result) ? result : [];
      console.log(`   Found ${existing.length} existing templates.\n`);
    } catch (err) {
      console.warn(`   ⚠️  Could not fetch existing templates: ${err.message}`);
      console.warn("   Proceeding without idempotency guard.\n");
    }
  }

  const existingKeys = new Set(
    existing.map((t) => `${t.Title}|${t.ServiceType}`)
  );

  const report = {
    timestamp: new Date().toISOString(),
    mode: COMMIT ? "commit" : "dry-run",
    rows: [],
    summary: { total: rows.length, created: 0, skipped: 0, errors: 0 },
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNo = i + 2;
    const warnings = [];

    const rawTitle = get(row, hm, "標題 (Title)", "Title", "標題");
    const rawService = get(row, hm, "Service", "ServiceType", "Cloud Provider");
    const rawCategory = get(row, hm, "Email-Type", "Email Type", "TemplateCategory");
    const rawSubject = get(row, hm, "Email-Subject", "Email Subject", "Subject");
    const rawBody = get(row, hm, "Email-Body", "Email Body", "BodyHTML");
    const rawVarList = get(row, hm, "Necessary Input Data", "VariableList", "Variable List");
    const rawTo = get(row, hm, "To", "ToRecipients");
    const rawCc = get(row, hm, "Cc", "CC", "CcRecipients");
    const rawBcc = get(row, hm, "Bcc", "BCC", "BccRecipients");

    // Validate required fields
    if (!rawTitle) {
      report.rows.push({ row: rowNo, status: "skipped", reason: "Empty Title" });
      report.summary.skipped++;
      console.log(`  ⏭️  Row ${rowNo}: skipped — Empty Title`);
      continue;
    }

    const serviceType = normalizeService(rawService);
    if (!serviceType) {
      warnings.push(`Unknown ServiceType: "${rawService}" — defaulting to "General"`);
    }

    const category = normalizeCategory(rawCategory);
    if (!category) {
      warnings.push(`Unknown TemplateCategory: "${rawCategory}" — defaulting to "General"`);
    }

    const subject = normalizeTokens(rawSubject, warnings);
    const bodyHTML = normalizeTokens(rawBody, warnings);
    const toRecipients = normalizeTokens(rawTo, warnings);
    const ccRecipients = normalizeTokens(rawCc, warnings);
    const bccRecipients = normalizeTokens(rawBcc, warnings);
    const variableList = parseVariableList(rawVarList, warnings);

    const template = {
      Title: rawTitle,
      ServiceType: serviceType ?? "General",
      TemplateCategory: category ?? "General",
      Subject: subject,
      BodyHTML: bodyHTML,
      VariableList: variableList,
      ToRecipients: toRecipients,
      CcRecipients: ccRecipients,
      BccRecipients: bccRecipients,
      IsActive: true,
      SortOrder: i + 1,
    };

    const key = `${template.Title}|${template.ServiceType}`;
    const isDuplicate = existingKeys.has(key);

    if (warnings.length > 0) {
      console.log(`  ⚠️  Row ${rowNo} — ${rawTitle}:`);
      warnings.forEach((w) => console.log(`     • ${w}`));
    }

    if (!COMMIT) {
      console.log(`  📄 Row ${rowNo}: [DRY-RUN] ${rawTitle} (${template.ServiceType} / ${template.TemplateCategory})`);
      console.log(`     Subject: ${subject}`);
      if (toRecipients) console.log(`     To: ${toRecipients}`);
      if (variableList) console.log(`     Vars: ${variableList}`);
      report.rows.push({ row: rowNo, status: "dry-run", template, warnings });
      report.summary.created++;
      continue;
    }

    if (isDuplicate) {
      console.log(`  ⏭️  Row ${rowNo}: skipped — already exists: "${key}"`);
      report.rows.push({ row: rowNo, status: "skipped", reason: "Duplicate Title+ServiceType", template, warnings });
      report.summary.skipped++;
      continue;
    }

    try {
      await postApi({ action: "CREATE", data: template, userEmail: USER_EMAIL });
      existingKeys.add(key);
      report.summary.created++;
      console.log(`  ✅ Row ${rowNo}: created "${rawTitle}" (${template.ServiceType})`);
      report.rows.push({ row: rowNo, status: "created", template, warnings });
    } catch (err) {
      console.error(`  ❌ Row ${rowNo}: FAILED "${rawTitle}" — ${err.message}`);
      report.rows.push({ row: rowNo, status: "error", error: err.message, template, warnings });
      report.summary.errors++;
    }

    await sleep();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n━━━ MIGRATION COMPLETE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`${COMMIT ? "✅ Created" : "📄 Would create"}: ${report.summary.created}`);
  console.log(`⏭️  Skipped:  ${report.summary.skipped}`);
  if (COMMIT) console.log(`❌ Errors:   ${report.summary.errors}`);

  const reportPath = path.join(__dirname, `migration-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report → ${reportPath}`);

  if (!COMMIT) {
    console.log("\n💡 Review the output above, then run with --commit to apply.");
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
