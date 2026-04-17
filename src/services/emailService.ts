const URL = import.meta.env.VITE_API_EMAIL_URL as string;

export interface EmailLog {
  id: number;
  Title: string;
  OrderTitle: string;
  OrderID: number;
  TemplateName: string;
  SentBy: string;
  SentTo: string;
  CC?: string;
  Subject: string;
  BodySnapshot: string;
  SentAt: string;
  Status: "Sent" | "Failed";
  ErrorMessage?: string;
}

export interface SendEmailInput {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  orderId: number;
  orderTitle: string;
  templateName: string;
  userEmail: string;
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

function withId(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withId);
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = { ...obj };
    if ("ID" in obj) result.id = obj.ID;
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
  if (!res.ok) throw new Error(`emailService error: ${res.status}`);
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

export const emailService = {
  send: (input: SendEmailInput): Promise<{ logId: number }> =>
    call<{ logId: number }>({ action: "SEND", data: input }),

  findByOrder: (orderTitle: string): Promise<EmailLog[]> =>
    call<EmailLog[]>({ action: "GET_BY_ORDER", data: { orderTitle } }),

  findAll: (): Promise<EmailLog[]> =>
    call<EmailLog[]>({ action: "GET_ALL" }),
};
