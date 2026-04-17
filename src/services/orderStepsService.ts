const URL = import.meta.env.VITE_API_ORDER_STEPS_URL as string;

export interface OrderStep {
  id?: number;
  OrderID: number;
  StepKey: string;
  StepLabel: string;
  CompletedAt: string; // ISO date string
  CompletedBy: string;
}

async function call<T>(body: object): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`orderStepsService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value)) return json.data.value as T;
    if (json.data != null) return json.data as T;
  }
  return json as T;
}

export const orderStepsService = {
  getByOrderId: async (orderId: number): Promise<OrderStep[]> => {
    if (!URL) return [];
    return call<OrderStep[]>({ action: "GET_BY_ORDER", data: { OrderID: orderId } });
  },

  complete: async (
    orderId: number,
    stepKey: string,
    stepLabel: string,
    userEmail: string,
  ): Promise<OrderStep> => {
    return call<OrderStep>({
      action: "CREATE",
      userEmail,
      data: {
        Title: stepKey,
        OrderID: orderId,
        StepKey: stepKey,
        StepLabel: stepLabel,
        CompletedAt: new Date().toISOString(),
        CompletedBy: userEmail,
      },
    });
  },

  uncomplete: async (orderId: number, stepKey: string, userEmail: string): Promise<void> => {
    return call<void>({
      action: "DELETE_BY_STEP",
      userEmail,
      data: { OrderID: orderId, StepKey: stepKey },
    });
  },
};
