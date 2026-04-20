const URL = import.meta.env.VITE_API_ORDERS_URL as string;
const PAGE_URL = import.meta.env.VITE_API_GET_PAGE_URL as string;

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
  ServiceType?: string;
  OasisNumber?: string;
  OrderReceiveDate?: string;
  CxSCompleteDate?: string;
  ContactPerson?: string;
  ContactNo?: string;
  ContactEmail?: string;
  BillingAddress?: string;
  BillingAccount?: string;
  AccountName?: string;
  AccountLoginEmail?: string;
  Password?: string;
  OtherAccountInfo?: string;
  CxSRequestNo?: string;
  TID?: string;
  SDNumber?: string;
  PSJob?: string;
  T2T3?: string;
  WelcomeLetter?: string;
  By?: string;
  OrderFormURL?: string;
  Remark?: string;
  SubName?: string;
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
  ServiceType?: string;
  OasisNumber?: string;
  OrderReceiveDate?: string;
  CxSCompleteDate?: string;
  ContactPerson?: string;
  ContactNo?: string;
  ContactEmail?: string;
  BillingAddress?: string;
  BillingAccount?: string;
  AccountName?: string;
  AccountLoginEmail?: string;
  Password?: string;
  OtherAccountInfo?: string;
  CxSRequestNo?: string;
  TID?: string;
  SDNumber?: string;
  PSJob?: string;
  T2T3?: string;
  WelcomeLetter?: string;
  By?: string;
  OrderFormURL?: string;
  Remark?: string;
  SubName?: string;
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

// Maps SharePoint "ID" → "id" and lookup ID fields to their base names.
// SharePoint lookup columns return the numeric ID as "<FieldName>Id" (e.g. CustomerIDId → CustomerID).
function withId(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withId);
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = { ...obj };
    if ("ID" in obj) result.id = obj.ID;
    // Prefer the raw lookup ID over the normalised choice value
    if ("CustomerIDId" in obj && obj.CustomerIDId != null)
      result.CustomerID = obj.CustomerIDId;
    return result;
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

async function findAll(): Promise<Order[]> {
  return call<Order[]>({ action: "GET_ALL" });
}

// Paginated fetch — uses the dedicated GET_PAGE flow (VITE_API_ORDERS_PAGE_URL).
// The separate flow avoids the 504 timeout that affects GET_ALL on the main flow.
async function findPaginated(limit: number, offset: number): Promise<Order[]> {
  const res = await fetch(PAGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "GET_PAGE", limit, offset }),
  });
  if (!res.ok) throw new Error(`orderService paginated error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value))
      return withId(normalizeChoiceFields(json.data.value)) as Order[];
    if (json.data != null)
      return withId(normalizeChoiceFields(json.data)) as Order[];
  }
  return withId(normalizeChoiceFields(json)) as Order[];
}

export const orderService = {
  findAll,
  findPaginated,

  // kept for manual refresh button — prefer useInvalidateOrders() from useOrdersQuery
  refresh: findAll,

  findById: async (id: number): Promise<Order> => {
    return call<Order>({ action: "GET_BY_TITLE", id });
  },

  findByTitle: async (title: string): Promise<Order> => {
    const orders = await findAll();
    const order = orders.find((o) => o.Title === title);
    if (!order) throw new Error(`Order not found: ${title}`);
    return order;
  },

  create: async (data: CreateOrderInput, userEmail: string): Promise<Order> => {
    return call<Order>({ action: "CREATE", data, userEmail });
  },

  update: async (
    id: number,
    data: Partial<CreateOrderInput>,
    userEmail: string,
  ): Promise<Order> => {
    const sanitized: Partial<CreateOrderInput> = { ...data };
    if (sanitized.CustomerID !== undefined)
      sanitized.CustomerID = Number(sanitized.CustomerID);
    return call<Order>({
      action: "UPDATE",
      data: { id, ...sanitized },
      userEmail,
    });
  },
};
