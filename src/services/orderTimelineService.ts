const URL = import.meta.env.VITE_API_ORDER_TIMELINE_URL as string;

export interface TimelineEvent {
  id: number;
  Title: string;
  OrderId: string;
  EventDate: string;
  Description: string;
  Completed: boolean;
}

export interface AddEventInput {
  Title: string;
  OrderId: string;
  EventDate: string;
  Description: string;
  Completed: boolean;
}

async function call<T>(body: object): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`orderTimelineService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value)) return json.data.value as T;
    if (json.data != null) return json.data as T;
  }
  return json as T;
}

function unwrap(val: unknown): unknown {
  if (val != null && typeof val === "object" && "Value" in (val as object)) {
    return (val as { Value: unknown }).Value;
  }
  return val;
}

function normalizeEvent(item: Record<string, unknown>): TimelineEvent {
  return {
    id: (item.ID ?? item.id) as number,
    Title: unwrap(item.Title) as string,
    OrderId: unwrap(item.OrderId) as string,
    EventDate: unwrap(item.EventDate) as string,
    Description: unwrap(item.Description) as string,
    Completed: unwrap(item.Completed) as boolean,
  };
}

export const orderTimelineService = {
  getByOrder: async (orderID: string) => {
    const items = await call<Record<string, unknown>[]>({
      action: "GET_BY_ORDER",
      data: { orderID },
    });
    return items.map(normalizeEvent);
  },

  addEvent: (data: AddEventInput, userEmail: string) =>
    call<TimelineEvent>({ action: "ADD_EVENT", data, userEmail }),
};
