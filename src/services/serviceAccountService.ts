const BASE_URL = import.meta.env.VITE_API_SERVICE_ACCOUNTS_URL as string;

export interface ServiceAccount {
  id: number;
  Title: string;
  CustomerID?: number;
  Provider: string;
  PrimaryAccountID?: string;
  SecondaryID?: string;
  AccountName?: string;
  Domain?: string;
  LoginEmail?: string;
  Password?: string;
  OtherInfo?: string;
  AccountStatus?: "Active" | "Terminated";
}

export interface CreateServiceAccountInput {
  Title: string;
  CustomerIDId?: number;
  Provider: string;
  PrimaryAccountID?: string;
  SecondaryID?: string;
  AccountName?: string;
  Domain?: string;
  LoginEmail?: string;
  Password?: string;
  OtherInfo?: string;
  AccountStatus?: "Active" | "Terminated";
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
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`serviceAccountService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value))
      return withId(json.data.value as T) as T;
    if (json.data != null) return withId(json.data as T) as T;
  }
  return withId(json as T) as T;
}

export const serviceAccountService = {
  create: (data: CreateServiceAccountInput, userEmail: string) =>
    call<ServiceAccount>({ action: "CREATE", data, userEmail }),

  findAll: async (): Promise<ServiceAccount[]> => {
    const result = await call<unknown>({ action: "GET_ALL" });
    return Array.isArray(result) ? (result as ServiceAccount[]) : [];
  },

  findBySecondaryId: async (secondaryId: string) => {
    const result = await call<unknown>({ action: "GET_BY_ACCOUNT_ID", data: { SecondaryID: secondaryId } });
    return Array.isArray(result) ? (result as ServiceAccount[]) : [];
  },

  update: (id: number, data: Partial<CreateServiceAccountInput>, userEmail: string) =>
    call<ServiceAccount>({ action: "UPDATE", data: { id, ...data }, userEmail }),
};
