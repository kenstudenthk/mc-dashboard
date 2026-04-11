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
    if (Array.isArray(json.data?.value)) return json.data.value as T;
    if (json.data != null) return json.data as T;
  }
  return json as T;
}

export const auditLogService = {
  findAll: () => call<AuditLog[]>({ action: "GET_ALL" }),

  create: (data: CreateAuditLogInput) =>
    call<AuditLog>({ action: "CREATE", data }),
};
