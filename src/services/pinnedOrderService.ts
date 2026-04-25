// src/services/pinnedOrderService.ts
const FLOW_URL = import.meta.env.VITE_API_PINNED_ORDER_URL as string;

interface PinRecord {
  OrderId: string;
}

async function call<T>(body: object): Promise<T> {
  const res = await fetch(FLOW_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`pinnedOrderService: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const pinnedOrderService = {
  async getPinned(userEmail: string): Promise<number[]> {
    const data = await call<{ value: PinRecord[] }>({
      action: "GET_BY_USER",
      data: {},
      userEmail,
    });
    return (data.value ?? []).map((r) => Number(r.OrderId));
  },

  async pin(userEmail: string, orderId: number): Promise<void> {
    await call<void>({
      action: "PIN",
      data: { OrderId: String(orderId), PinnedAt: new Date().toISOString() },
      userEmail,
    });
  },

  async unpin(userEmail: string, orderId: number): Promise<void> {
    await call<void>({
      action: "UNPIN",
      data: { OrderId: String(orderId) },
      userEmail,
    });
  },
};
