const URL = import.meta.env.VITE_API_CUSTOMERS_URL as string;

export interface Customer {
  id: number;
  Title: string;
  Email: string;
  Phone: string;
  Company: string;
  Status: "Active" | "Inactive";
  Tier: "Standard" | "Premium" | "Enterprise";
  SpecialNotes: string;
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
    if (Array.isArray(json.data?.value)) return json.data.value as T;
    if (json.data != null) return json.data as T;
  }
  return json as T;
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
