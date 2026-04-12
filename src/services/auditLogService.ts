const URL = import.meta.env.VITE_API_AUDIT_LOGS_URL as string;

export interface AuditLog {
  id: number;
  Title: string;
  UserEmail: string;
  Action: "Create" | "Update" | "Delete";
  TargetID: string;
  Details: string;
  Created?: string;
}

export interface CreateAuditLogInput {
  Title: string;
  UserEmail: string;
  Action: AuditLog["Action"];
  TargetID: string;
  Details: string;
}

function normalizeChoiceFields<T>(data: T): T {
  if (Array.isArray(data)) return data.map(normalizeChoiceFields) as T;
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if ("Value" in obj && typeof obj["Value"] === "string")
      return obj["Value"] as T;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, normalizeChoiceFields(v)]),
    ) as T;
  }
  return data;
}

async function call<T>(body: object): Promise<T> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`auditLogService error: ${res.status}`);
  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value))
      return normalizeChoiceFields(json.data.value as T);
    if (json.data != null) return normalizeChoiceFields(json.data as T);
  }
  return normalizeChoiceFields(json as T);
}

export const auditLogService = {
  findAll: () => call<AuditLog[]>({ action: "GET_ALL" }),

  create: (data: CreateAuditLogInput) =>
    call<AuditLog>({ action: "CREATE", data }),
};
