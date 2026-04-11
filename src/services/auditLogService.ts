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
  return res.json() as Promise<T>;
}

export const auditLogService = {
  findAll: () => call<AuditLog[]>({ action: "GET_ALL" }),

  create: (data: CreateAuditLogInput) =>
    call<AuditLog>({ action: "CREATE", data }),
};
