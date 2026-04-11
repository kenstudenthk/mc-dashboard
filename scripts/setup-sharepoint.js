/**
 * SharePoint List Provisioning Script
 *
 * Just run:  npm run setup:sharepoint
 *
 * The script will:
 *   1. Auto-install @azure/identity if not found
 *   2. Open a Device Code login — sign in with your Microsoft 365 account
 *   3. Create all missing SharePoint lists and columns automatically
 *
 * No app registration required — uses Microsoft's public client.
 * Safe to re-run — idempotent.
 */

import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ──────────────────────────────────────────────────────────
try {
  const env = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* .env.local not found — use hardcoded fallback */
}

// Site ID hardcoded — override via SHAREPOINT_SITE_ID in .env.local if needed
const SITE_ID =
  process.env.SHAREPOINT_SITE_ID ||
  "pccw0.sharepoint.com,f6281a1f-762e-4216-a070-3b1ddb8dbdc7,c741a961-4f9b-4f24-aaef-af319d78cfa6";

const GRAPH = "https://graph.microsoft.com/v1.0";

// Microsoft public client ID (Azure CLI) — no app registration needed
const CLIENT_ID = "04b07795-8542-4c45-a1c4-6ba3a34ba4ee";
const SCOPES = ["https://graph.microsoft.com/Sites.ReadWrite.All"];

// ─── List Schema ──────────────────────────────────────────────────────────────
const text = () => ({ text: { allowMultipleLines: false } });
const multiline = () => ({ text: { allowMultipleLines: true } });
const choice = (choices) => ({
  choice: { choices, displayAs: "dropDownMenu" },
});
const number = () => ({ number: {} });
const currency = () => ({ currency: { locale: "en-US" } });
const dateTime = () => ({
  dateTime: { displayAs: "default", format: "dateTime" },
});
const boolean = () => ({ boolean: {} });
const hyperlink = () => ({ hyperlinkOrPicture: { isPicture: false } });

const LISTS_SCHEMA = [
  {
    name: "App_Customers",
    description: "Customer details, tiers, and special notes",
    columns: [
      { name: "Email", ...text() },
      { name: "Phone", ...text() },
      { name: "Company", ...text() },
      { name: "Status", ...choice(["Active", "Inactive"]) },
      { name: "Tier", ...choice(["Standard", "Premium", "Enterprise"]) },
      { name: "SpecialNotes", ...multiline() },
    ],
  },
  {
    name: "App_Orders",
    description: "Main order information",
    columns: [
      { name: "CustomerID", ...number() },
      { name: "CustomerName", ...text() },
      {
        name: "OrderType",
        ...choice(["Install", "Termination", "Upgrade", "Downgrade"]),
      },
      {
        name: "Status",
        ...choice(["Processing", "Account Created", "Completed", "Cancelled"]),
      },
      { name: "SRD", ...dateTime() },
      {
        name: "CloudProvider",
        ...choice([
          "AWS",
          "Azure",
          "Huawei Cloud",
          "Google Cloud",
          "Alibaba Cloud",
        ]),
      },
      { name: "Amount", ...currency() },
    ],
  },
  {
    name: "App_OrderTimeline",
    description:
      "Timeline events per order — separate list to avoid nested arrays",
    columns: [
      { name: "OrderID", ...text() },
      { name: "EventDate", ...dateTime() },
      { name: "Description", ...multiline() },
      { name: "Completed", ...boolean() },
    ],
  },
  {
    name: "App_AuditLogs",
    description: "Audit trail — who did what and when",
    columns: [
      { name: "UserEmail", ...text() },
      { name: "Action", ...choice(["Create", "Update", "Delete"]) },
      { name: "TargetID", ...text() },
      { name: "Details", ...multiline() },
    ],
  },
  {
    name: "App_QuickLinks",
    description: "Portal links managed by Global Admins",
    columns: [
      { name: "URL", ...hyperlink() },
      { name: "Description", ...multiline() },
    ],
  },
  {
    name: "App_UserRoles",
    description: "Maps user emails to their access level",
    columns: [
      {
        name: "Role",
        ...choice(["Developer", "Global Admin", "Admin", "User"]),
      },
    ],
  },
];

// ─── Step 1: Auto-install @azure/identity if missing ─────────────────────────
function ensureAzureIdentity() {
  try {
    createRequire(import.meta.url).resolve("@azure/identity");
    return; // already installed
  } catch {
    /* not found */
  }

  console.log("@azure/identity not found — installing...\n");
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["install", "--save-dev", "@azure/identity"], {
    stdio: "inherit",
    cwd: resolve(__dirname, ".."),
  });
  if (result.status !== 0) {
    console.error(
      "\n✗ Installation failed. Try manually: npm install --save-dev @azure/identity",
    );
    process.exit(1);
  }
  console.log("\n✓ @azure/identity installed\n");
}

// ─── Step 2: Interactive Browser login ───────────────────────────────────────
async function getAccessToken() {
  const { InteractiveBrowserCredential } = await import("@azure/identity");

  console.log("\n─────────────────────────────────────────");
  console.log(
    "A browser window will open — sign in with your Microsoft 365 account.",
  );
  console.log("─────────────────────────────────────────\n");

  const credential = new InteractiveBrowserCredential({
    clientId: CLIENT_ID,
    tenantId: "common",
    redirectUri: "http://localhost",
  });

  const token = await credential.getToken(SCOPES);
  return token.token;
}

// ─── Graph API helpers ────────────────────────────────────────────────────────
async function graphGet(path, accessToken) {
  const res = await fetch(`${GRAPH}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GET ${path} failed (${res.status}):\n${body}`);
  }
  return res.json();
}

async function graphPost(path, body, accessToken) {
  const res = await fetch(`${GRAPH}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST ${path} failed (${res.status}):\n${err}`);
  }
  return res.json();
}

// ─── List & Column provisioning ───────────────────────────────────────────────
async function getList(name, accessToken) {
  return graphGet(
    `/sites/${SITE_ID}/lists/${encodeURIComponent(name)}`,
    accessToken,
  );
}

async function createList(listDef, accessToken) {
  console.log(`  → Creating "${listDef.name}"...`);
  const result = await graphPost(
    `/sites/${SITE_ID}/lists`,
    {
      displayName: listDef.name,
      description: listDef.description,
      list: { template: "genericList" },
    },
    accessToken,
  );
  console.log(`  ✓ Created (id: ${result.id})`);
  return result.id;
}

async function getExistingColumns(listId, accessToken) {
  const result = await graphGet(
    `/sites/${SITE_ID}/lists/${listId}/columns`,
    accessToken,
  );
  return new Set((result?.value ?? []).map((c) => c.name.toLowerCase()));
}

async function addColumn(listId, colDef, accessToken) {
  process.stdout.write(`    + ${colDef.name}... `);
  await graphPost(
    `/sites/${SITE_ID}/lists/${listId}/columns`,
    colDef,
    accessToken,
  );
  console.log("✓");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n================================================");
  console.log("  SharePoint List Provisioning");
  console.log("================================================\n");

  // Step 1 — ensure dependency
  ensureAzureIdentity();

  // Step 2 — device code login
  const accessToken = await getAccessToken();
  console.log("\n✓ Signed in successfully");
  console.log(`✓ Site: ${SITE_ID}\n`);
  console.log("------------------------------------------------");

  // Step 3 — provision lists and columns
  for (const listDef of LISTS_SCHEMA) {
    console.log(`\n[${listDef.name}]`);
    const existing = await getList(listDef.name, accessToken);

    let listId;
    if (!existing) {
      listId = await createList(listDef, accessToken);
      for (const col of listDef.columns)
        await addColumn(listId, col, accessToken);
    } else {
      listId = existing.id;
      console.log(`  ✓ Already exists`);

      const existingCols = await getExistingColumns(listId, accessToken);
      const missing = listDef.columns.filter(
        (c) => !existingCols.has(c.name.toLowerCase()),
      );

      if (missing.length === 0) {
        console.log(`  ✓ All columns present`);
      } else {
        console.log(`  ! Adding ${missing.length} missing column(s):`);
        for (const col of missing) await addColumn(listId, col, accessToken);
      }
    }
  }

  console.log("\n================================================");
  console.log("  ✓ All done — SharePoint is ready!");
  console.log("================================================\n");
}

main().catch((err) => {
  console.error("\n✗ Error:", err.message);
  process.exit(1);
});
