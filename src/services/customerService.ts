const URL = import.meta.env.VITE_API_CUSTOMERS_URL as string;

export interface Customer {
  id: number;
  Title?: string;
  Email: string;
  Phone?: string;
  Company?: string;
  Status: "Active" | "Inactive";
  Tier?: "Standard" | "Premium" | "Enterprise";
  SpecialNotes?: string;
}

export interface CreateCustomerInput {
  Title: string;
  Email: string;
  Phone: string;
  Company: string;
  Status: "Active" | "Inactive";
  Tier: "Standard" | "Premium" | "Enterprise";
  SpecialNotes?: string;
}

function normalizeChoiceFields<T>(data: T): T {
  if (Array.isArray(data)) return data.map(normalizeChoiceFields) as T;
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if ("Value" in obj) return normalizeChoiceFields(obj["Value"]) as T;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, normalizeChoiceFields(v)]),
    ) as T;
  }
  return data;
}

// Maps SharePoint "ID" → "id" so the interface's `id` field is always populated.
function withId(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withId);
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if ("ID" in obj) return { ...obj, id: obj.ID };
  }
  return data;
}

async function call<T>(body: object): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`customerService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value))
      return withId(normalizeChoiceFields(json.data.value as T)) as T;
    if (json.data != null)
      return withId(normalizeChoiceFields(json.data as T)) as T;
  }
  return withId(normalizeChoiceFields(json as T)) as T;
}

export const customerService = {
  findAll: () => call<Customer[]>({ action: "GET_ALL" }),

  findById: (id: number) => call<Customer>({ action: "GET_ONE", data: { id } }),

  create: (data: CreateCustomerInput, userEmail: string) =>
    call<Customer>({ action: "CREATE", data, userEmail }),

  update: (id: number, data: Partial<CreateCustomerInput>, userEmail: string) =>
    call<Customer>({ action: "UPDATE", data: { id, ...data }, userEmail }),

  delete: (id: number, userEmail: string) =>
    call<void>({ action: "DELETE", data: { id }, userEmail }),
};
