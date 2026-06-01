const URL = (
  import.meta.env.VITE_API_MASTER_LIST_URL ||
  import.meta.env.VITE_API_MASTERLIST_URL
) as string;

export interface MasterListAccount {
  id: number;
  Title?: string;
  CustomerID?: number;
  CustomerIDId?: number;
  BillingAccount?: string;
  Payer_AWS_ID?: string;
  MasterAccount?: string;
  MasterAccountID?: string;
  PrimaryAccountID?: string;
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

async function call<T>(body: object): Promise<T> {
  if (!URL) throw new Error("VITE_API_MASTER_LIST_URL is not set");

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`masterListService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value))
      return withId(json.data.value as T) as T;
    if (json.data != null) return withId(json.data as T) as T;
  }
  return withId(json as T) as T;
}

export const masterListService = {
  create: (data: Partial<MasterListAccount>, userEmail: string) =>
    call<MasterListAccount>({ action: "CREATE", data, userEmail }),

  findAll: async (): Promise<MasterListAccount[]> => {
    const result = await call<unknown>({ action: "GET_ALL" });
    return Array.isArray(result) ? (result as MasterListAccount[]) : [];
  },

  findByCustomerId: async (customerId: number): Promise<MasterListAccount[]> => {
    const result = await call<unknown>({
      action: "GET_BY_CUSTOMER",
      data: { CustomerID: customerId },
    });
    return Array.isArray(result) ? (result as MasterListAccount[]) : [];
  },

  update: (id: number, data: Partial<MasterListAccount>, userEmail: string) =>
    call<MasterListAccount>({ action: "UPDATE", data: { id, ...data }, userEmail }),
};
