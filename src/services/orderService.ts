const URL = import.meta.env.VITE_API_ORDERS_URL as string;

export interface Order {
  id: number;
  Title: string;
  CustomerID?: number;
  CustomerName: string;
  OrderType: string;
  Status: string;
  SRD: string;
  CloudProvider: string;
  Amount: number;
  AccountID?: string;
}

export interface CreateOrderInput {
  Title: string;
  CustomerID?: number;
  CustomerName: string;
  OrderType: string;
  Status: string;
  SRD: string;
  CloudProvider: string;
  Amount: number;
  AccountID?: string;
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
  if (!res.ok) throw new Error(`orderService error: ${res.status}`);
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

export const orderService = {
  findAll: () => call<Order[]>({ action: "GET_ALL" }),

  findById: (id: number) => call<Order>({ action: "GET_ONE", data: { id } }),

  findByTitle: async (title: string): Promise<Order> => {
    const orders = await call<Order[]>({ action: "GET_ALL" });
    const order = orders.find((o) => o.Title === title);
    if (!order) throw new Error(`Order not found: ${title}`);
    return order;
  },

  create: (data: CreateOrderInput, userEmail: string) =>
    call<Order>({ action: "CREATE", data, userEmail }),

  update: (id: number, data: Partial<CreateOrderInput>, userEmail: string) =>
    call<Order>({ action: "UPDATE", data: { id, ...data }, userEmail }),
};
