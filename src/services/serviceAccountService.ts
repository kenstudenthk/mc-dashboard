import { trimTrailingWhitespaceDeep } from "../utils/trimData";

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
  OtherAccountInfo?: string;
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
  OtherAccountInfo?: string;
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
    body: JSON.stringify(trimTrailingWhitespaceDeep(body)),
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

export function normalizeAccountId(value: string): string {
  return value.trim().toLowerCase();
}

export async function resolveOrCreateServiceAccount(
  accountId: string,
  provider: string,
  userEmail: string,
  knownAccounts?: ServiceAccount[],
  createData?: Partial<CreateServiceAccountInput>,
): Promise<{ id: number; created: boolean }> {
  if (!accountId.trim()) throw new Error("Account ID must not be empty");
  const accounts = knownAccounts ?? await serviceAccountService.findAll();
  const match = accounts.find(
    (sa) => normalizeAccountId(sa.SecondaryID ?? "") === normalizeAccountId(accountId),
  );
  if (match) {
    if (createData?.CustomerIDId != null && match.CustomerID !== createData.CustomerIDId) {
      await serviceAccountService.update(match.id, { CustomerIDId: createData.CustomerIDId }, userEmail);
    }
    return { id: match.id, created: false };
  }
  const created = await serviceAccountService.create(
    {
      Title: accountId.trim(),
      AccountStatus: "Active",
      ...createData,
      Provider: provider,
      SecondaryID: accountId.trim(),
    },
    userEmail,
  );
  return { id: created.id, created: true };
}

function remapCustomerID<T extends { CustomerIDId?: number | string }>(
  data: T,
): Omit<T, "CustomerIDId"> & { CustomerID?: number } {
  const { CustomerIDId, ...rest } = data;
  return CustomerIDId != null && CustomerIDId !== ""
    ? { ...rest, CustomerID: Number(CustomerIDId) }
    : rest;
}

export const serviceAccountService = {
  create: (data: CreateServiceAccountInput, userEmail: string) =>
    call<ServiceAccount>({ action: "CREATE", data: remapCustomerID(data), userEmail }),

  findAll: async (): Promise<ServiceAccount[]> => {
    const result = await call<unknown>({ action: "GET_ALL" });
    return Array.isArray(result) ? (result as ServiceAccount[]) : [];
  },

  findByCustomerId: async (customerId: number): Promise<ServiceAccount[]> => {
    const result = await call<unknown>({ action: "GET_BY_CUSTOMER", data: { CustomerID: customerId } });
    return Array.isArray(result) ? (result as ServiceAccount[]) : [];
  },

  findBySecondaryId: async (secondaryId: string): Promise<ServiceAccount[]> => {
    const result = await call<unknown>({ action: "GET_BY_ACCOUNT_ID", data: { SecondaryID: secondaryId } });
    return Array.isArray(result) ? (result as ServiceAccount[]) : [];
  },

  update: (id: number, data: Partial<CreateServiceAccountInput>, userEmail: string) =>
    call<ServiceAccount>({ action: "UPDATE", data: { id, ...remapCustomerID(data) }, userEmail }),
};
