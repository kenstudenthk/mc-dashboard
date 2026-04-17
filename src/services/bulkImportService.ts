import * as XLSX from "xlsx";
import type { Customer } from "./customerService";
import type {
  RawRow,
  ParsedRow,
  RowError,
  ValidationResult,
  ConflictItem,
  FinalRow,
} from "../components/BulkImport/BulkImportTypes";

export const ORDER_TYPE_VALUES = [
  "New Install",
  "Misc Change",
  "Contract Renewal",
  "Termination",
  "Pre-Pro",
] as const;

export const STATUS_VALUES = [
  "Completed",
  "Account Created",
  "Pending for order issued",
  "Processing",
  "Cancelled",
  "Pending Closure",
  "Pending for other parties",
] as const;

export const CLOUD_PROVIDER_VALUES = [
  "AWS",
  "Azure",
  "Huawei",
  "GCP",
  "Alibaba",
  "Tencent",
] as const;

const REQUIRED_HEADERS = [
  "Title",
  "CustomerName",
  "OrderType",
  "Status",
  "SRD",
  "CloudProvider",
  "Amount",
] as const;

const OPTIONAL_HEADERS = [
  "AccountID",
  "ServiceType",
  "OasisNumber",
  "OrderReceiveDate",
  "CxSCompleteDate",
  "ContactPerson",
  "ContactNo",
  "ContactEmail",
  "BillingAddress",
  "BillingAccount",
  "AccountName",
  "AccountLoginEmail",
  "OtherAccountInfo",
  "CxSRequestNo",
  "TID",
  "SDNumber",
  "PSJob",
  "T2T3",
  "WelcomeLetter",
  "By",
  "OrderFormURL",
  "Remark",
  "SubName",
] as const;

export function generateTemplate(): void {
  const headers = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];
  const exampleRow = [
    "CL549486",
    "Acme Corporation",
    "New Install",
    "Processing",
    "2024-06-15",
    "AWS",
    "1200",
    "123456789",
    "Cloud Hosting",
    "OAS-001",
    "2024-06-01",
    "2024-06-20",
    "John Smith",
    "+852 1234 5678",
    "john@acme.com",
    "1 Example Street, HK",
    "BILL-001",
    "Acme-AWS-Prod",
    "admin@acme.com",
    "",
    "",
    "REQ-001",
    "TID-001",
    "SD-001",
    "N",
    "T2",
    "Yes",
    "Jane Doe",
    "",
    "Initial setup order",
    "Acme Cloud Project",
  ];

  const notesData = [
    ["Field", "Valid Values / Format"],
    ["Title", "Service number (e.g. CL549486). Required."],
    ["CustomerName", "Company name. Required."],
    ["OrderType", ORDER_TYPE_VALUES.join(" | ") + ". Required."],
    ["Status", STATUS_VALUES.join(" | ") + ". Required."],
    ["SRD", "Date in YYYY-MM-DD or DD/MM/YYYY format. Required."],
    ["CloudProvider", CLOUD_PROVIDER_VALUES.join(" | ") + ". Required."],
    ["Amount", "Numeric value (e.g. 1200). Required."],
    ["PSJob", "Y or N"],
    ["T2T3", "T1 | T2 | T3 | N/A"],
    ["WelcomeLetter", "Yes or No"],
    ["OrderReceiveDate", "Date in YYYY-MM-DD or DD/MM/YYYY format"],
    ["CxSCompleteDate", "Date in YYYY-MM-DD or DD/MM/YYYY format"],
    ["All other fields", "Optional free text"],
  ];

  const wb = XLSX.utils.book_new();
  const ordersWs = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  XLSX.utils.book_append_sheet(wb, ordersWs, "Orders");
  const notesWs = XLSX.utils.aoa_to_sheet(notesData);
  XLSX.utils.book_append_sheet(wb, notesWs, "Notes");
  XLSX.writeFile(wb, "bulk-order-import-template.xlsx");
}

export async function parseFile(file: File): Promise<RawRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false, raw: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: "",
    raw: false,
  });
  return rows.map((raw, i) => ({ rowIndex: i + 2, raw }));
}

function normaliseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return trimmed;
  }

  // DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    const date = new Date(iso);
    if (!isNaN(date.getTime())) return iso;
  }

  // Try generic parse as last resort
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }

  return null;
}

function findCanonical<T extends string>(
  value: string,
  list: readonly T[],
): T | null {
  const lower = value.toLowerCase().trim();
  return list.find((v) => v.toLowerCase() === lower) ?? null;
}

export function validateRows(rawRows: RawRow[]): ValidationResult {
  const valid: ParsedRow[] = [];
  const errors: RowError[] = [];

  for (const { rowIndex, raw } of rawRows) {
    const rowErrors: RowError[] = [];

    const str = (field: string): string =>
      typeof raw[field] === "string" ? (raw[field] as string).trim() : String(raw[field] ?? "").trim();

    // Required: Title
    const title = str("Title");
    if (!title) rowErrors.push({ rowIndex, field: "Title", message: "Service No (Title) is required." });

    // Required: CustomerName
    const customerName = str("CustomerName");
    if (!customerName) rowErrors.push({ rowIndex, field: "CustomerName", message: "Customer name is required." });

    // Required: OrderType (enum)
    const rawOrderType = str("OrderType");
    const orderType = findCanonical(rawOrderType, ORDER_TYPE_VALUES);
    if (!rawOrderType) {
      rowErrors.push({ rowIndex, field: "OrderType", message: "Order type is required." });
    } else if (!orderType) {
      rowErrors.push({ rowIndex, field: "OrderType", message: `"${rawOrderType}" is not a valid order type. Valid: ${ORDER_TYPE_VALUES.join(", ")}.` });
    }

    // Required: Status (enum)
    const rawStatus = str("Status");
    const status = findCanonical(rawStatus, STATUS_VALUES);
    if (!rawStatus) {
      rowErrors.push({ rowIndex, field: "Status", message: "Status is required." });
    } else if (!status) {
      rowErrors.push({ rowIndex, field: "Status", message: `"${rawStatus}" is not a valid status. Valid: ${STATUS_VALUES.join(", ")}.` });
    }

    // Required: SRD (date)
    const rawSrd = str("SRD");
    const srd = rawSrd ? normaliseDate(rawSrd) : null;
    if (!rawSrd) {
      rowErrors.push({ rowIndex, field: "SRD", message: "Service Request Date (SRD) is required." });
    } else if (!srd) {
      rowErrors.push({ rowIndex, field: "SRD", message: `"${rawSrd}" is not a valid date. Use YYYY-MM-DD or DD/MM/YYYY.` });
    }

    // Required: CloudProvider (enum)
    const rawProvider = str("CloudProvider");
    const provider = findCanonical(rawProvider, CLOUD_PROVIDER_VALUES);
    if (!rawProvider) {
      rowErrors.push({ rowIndex, field: "CloudProvider", message: "Cloud provider is required." });
    } else if (!provider) {
      rowErrors.push({ rowIndex, field: "CloudProvider", message: `"${rawProvider}" is not valid. Valid: ${CLOUD_PROVIDER_VALUES.join(", ")}.` });
    }

    // Required: Amount (number)
    const rawAmount = str("Amount");
    const amount = parseFloat(rawAmount);
    if (!rawAmount) {
      rowErrors.push({ rowIndex, field: "Amount", message: "Amount is required." });
    } else if (!isFinite(amount)) {
      rowErrors.push({ rowIndex, field: "Amount", message: `"${rawAmount}" is not a valid number.` });
    }

    // Optional date fields
    for (const dateField of ["OrderReceiveDate", "CxSCompleteDate"] as const) {
      const raw_v = str(dateField);
      if (raw_v && !normaliseDate(raw_v)) {
        rowErrors.push({ rowIndex, field: dateField, message: `"${raw_v}" is not a valid date. Use YYYY-MM-DD or DD/MM/YYYY.` });
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue;
    }

    const optionalStr = (field: string): string | undefined => {
      const v = str(field);
      return v || undefined;
    };

    const optionalDate = (field: string): string | undefined => {
      const v = str(field);
      return v ? (normaliseDate(v) ?? undefined) : undefined;
    };

    valid.push({
      rowIndex,
      Title: title,
      CustomerName: customerName,
      OrderType: orderType!,
      Status: status!,
      SRD: srd!,
      CloudProvider: provider!,
      Amount: amount,
      AccountID: optionalStr("AccountID"),
      ServiceType: optionalStr("ServiceType"),
      OasisNumber: optionalStr("OasisNumber"),
      OrderReceiveDate: optionalDate("OrderReceiveDate"),
      CxSCompleteDate: optionalDate("CxSCompleteDate"),
      ContactPerson: optionalStr("ContactPerson"),
      ContactNo: optionalStr("ContactNo"),
      ContactEmail: optionalStr("ContactEmail"),
      BillingAddress: optionalStr("BillingAddress"),
      BillingAccount: optionalStr("BillingAccount"),
      AccountName: optionalStr("AccountName"),
      AccountLoginEmail: optionalStr("AccountLoginEmail"),
      OtherAccountInfo: optionalStr("OtherAccountInfo"),
      CxSRequestNo: optionalStr("CxSRequestNo"),
      TID: optionalStr("TID"),
      SDNumber: optionalStr("SDNumber"),
      PSJob: optionalStr("PSJob"),
      T2T3: optionalStr("T2T3"),
      WelcomeLetter: optionalStr("WelcomeLetter"),
      By: optionalStr("By"),
      OrderFormURL: optionalStr("OrderFormURL"),
      Remark: optionalStr("Remark"),
      SubName: optionalStr("SubName"),
    });
  }

  return { valid, errors };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      curr[j] =
        a[i - 1] === b[j - 1]
          ? prev[j - 1]
          : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

export function levenshteinSimilarity(a: string, b: string): number {
  const la = a.toLowerCase();
  const lb = b.toLowerCase();
  const dist = levenshtein(la, lb);
  return 1 - dist / Math.max(la.length, lb.length, 1);
}

export function detectConflicts(
  rows: ParsedRow[],
  customers: Customer[],
): ConflictItem[] {
  const importedNames = [...new Set(rows.map((r) => r.CustomerName))];
  const conflicts: ConflictItem[] = [];

  for (const importedName of importedNames) {
    const exactMatch = customers.find(
      (c) => (c.Company ?? "").toLowerCase() === importedName.toLowerCase(),
    );
    if (exactMatch) continue;

    let best: { customer: Customer; score: number } | null = null;
    for (const c of customers) {
      if (!c.Company) continue;
      const score = levenshteinSimilarity(importedName, c.Company);
      if (score > 0.8 && (!best || score > best.score)) {
        best = { customer: c, score };
      }
    }

    if (best) {
      conflicts.push({
        importedName,
        suggestedName: best.customer.Company!,
        suggestedId: best.customer.id,
        similarity: best.score,
        resolution: "pending",
      });
    }
  }

  return conflicts;
}

export function applyConflictResolutions(
  rows: ParsedRow[],
  conflicts: ConflictItem[],
): FinalRow[] {
  const resolutionMap = new Map(conflicts.map((c) => [c.importedName, c]));

  return rows.map((row) => {
    const conflict = resolutionMap.get(row.CustomerName);
    if (conflict?.resolution === "accept") {
      return {
        ...row,
        resolvedCustomerName: conflict.suggestedName,
        resolvedCustomerId: conflict.suggestedId,
      };
    }
    return { ...row, resolvedCustomerName: row.CustomerName };
  });
}
