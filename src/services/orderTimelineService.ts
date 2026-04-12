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

export const orderTimelineService = {
  getByOrder: (orderID: string) =>
    call<TimelineEvent[]>({ action: "GET_BY_ORDER", data: { orderID } }),

  addEvent: (data: AddEventInput, userEmail: string) =>
    call<TimelineEvent>({ action: "ADD_EVENT", data, userEmail }),
};
