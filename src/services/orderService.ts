const URL = import.meta.env.VITE_API_ORDERS_URL as string;

export interface Order {
  id: number;
  Title: string;
  CustomerID: number;
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

async function call<T>(body: object): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`orderService error: ${res.status}`);
  return res.json() as Promise<T>;
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
