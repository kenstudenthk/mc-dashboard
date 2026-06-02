import { trimTrailingWhitespaceDeep } from "../utils/trimData";

const URL = import.meta.env.VITE_API_MASTER_ACCOUNT_URL as string;

export interface MasterListAccount {
  id: number;
  Title?: string;
  CustomerID?: number;
  CustomerIDId?: number;
  BillingAccount?: string;
  Billing_x0020_Account?: string;
  Billing_x0020_Account_x0020__x002f?: string;
  Payer_AWS_ID?: string;
  PayerAWSID?: string;
  Payer_x0020_AWS_x0020_ID?: string;
  Payer_x0020_AWS_x0020_Id?: string;
  MasterAccount?: string;
  MasterAccountID?: string;
  Master_x0020_Account?: string;
  Master_x0020_Account_x0020_ID?: string;
  PrimaryAccountID?: string;
  PrimaryID?: string;
  AccountID?: string;
  RootID?: string;
  AccountName?: string;
  Company?: string;
  Customer_Name?: string;
  Status?: string;
  [key: string]: unknown;
}

function withId(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withId);
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = { ...obj };
    if ("ID" in obj) result.id = obj.ID;
    if ("CustomerIDId" in obj && obj.CustomerIDId != null)
      result.CustomerID = obj.CustomerIDId;
    return result;
  }
  return data;
}

function unwrapData(data: unknown): unknown {
  if (data === null || typeof data !== "object") return data;
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.value)) return obj.value;
  if (Array.isArray(obj.body)) return obj.body;
  if (obj.body !== null && typeof obj.body === "object") {
    const body = obj.body as Record<string, unknown>;
    if (Array.isArray(body.value)) return body.value;
    if (Array.isArray(body.data)) return body.data;
  }
  if (obj.data !== null && typeof obj.data === "object") {
    const nested = unwrapData(obj.data);
    if (nested !== obj.data) return nested;
  }
  return data;
}

async function call<T>(body: object): Promise<T> {
  if (!URL) throw new Error("VITE_API_MASTER_ACCOUNT_URL is not set");

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trimTrailingWhitespaceDeep(body)),
  });
  if (!res.ok) throw new Error(`masterListService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (json.data != null) return withId(unwrapData(json.data) as T) as T;
  }
  return withId(unwrapData(json) as T) as T;
}

export const masterListService = {
  create: (data: Partial<MasterListAccount>, userEmail: string) =>
    call<MasterListAccount>({ action: "CREATE", data, userEmail }),

  findAll: async (): Promise<MasterListAccount[]> => {
    const result = await call<unknown>({ action: "GET_ALL" });
    return Array.isArray(result) ? (result as MasterListAccount[]) : [];
  },

  findByPayerAwsId: async (payerAwsId: string): Promise<MasterListAccount[]> => {
    const result = await call<unknown>({
      action: "GET_BY_CUSTOMER",
      data: { Payer_AWS_ID: payerAwsId },
    });
    return Array.isArray(result) ? (result as MasterListAccount[]) : [];
  },

  update: (id: number, data: Partial<MasterListAccount>, userEmail: string) =>
    call<MasterListAccount>({ action: "UPDATE", data: { id, ...data }, userEmail }),
};
