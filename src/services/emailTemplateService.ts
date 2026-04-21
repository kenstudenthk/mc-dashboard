const API_URL = import.meta.env.VITE_API_EMAIL_TEMPLATES_URL as string;

export interface EmailTemplate {
  id: number;
  Title: string;
  ServiceType: string;
  TemplateCategory: string;
  Subject: string;
  BodyHTML: string;
  VariableList?: string;
  Description?: string;
  SortOrder?: number;
  IsActive?: boolean;
  ToRecipients?: string;
  CcRecipients?: string;
  BccRecipients?: string;
  LastUpdatedBy?: string;
  LastUpdatedDate?: string;
}

export interface CreateEmailTemplateInput {
  Title: string;
  ServiceType: string;
  TemplateCategory: string;
  Subject: string;
  BodyHTML: string;
  VariableList?: string;
  Description?: string;
  SortOrder?: number;
  IsActive?: boolean;
  ToRecipients?: string;
  CcRecipients?: string;
  BccRecipients?: string;
}

export const SERVICE_TYPE_OPTIONS = [
  "AWS",
  "Azure",
  "GCP",
  "Alibaba",
  "Huawei",
  "Tencent",
  "General",
] as const;

export const TEMPLATE_CATEGORY_OPTIONS = [
  "Welcome Letter",
  "Order Confirmation",
  "Account Created",
  "Closure Notice",
  "Status Update",
  "General",
] as const;

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
  if (!API_URL) throw new Error("VITE_API_EMAIL_TEMPLATES_URL is not set");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`emailTemplateService error: ${res.status}`);
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

export const emailTemplateService = {
  findAll: (): Promise<EmailTemplate[]> =>
    call<EmailTemplate[]>({ action: "GET_ALL" }),

  findByService: (serviceType: string): Promise<EmailTemplate[]> =>
    call<EmailTemplate[]>({ action: "GET_BY_SERVICE", data: { serviceType } }),

  create: (
    data: CreateEmailTemplateInput,
    userEmail: string,
  ): Promise<EmailTemplate> =>
    call<EmailTemplate>({ action: "CREATE", data, userEmail }),

  update: (
    id: number,
    data: Partial<CreateEmailTemplateInput>,
    userEmail: string,
  ): Promise<EmailTemplate> =>
    call<EmailTemplate>({ action: "UPDATE", data: { id, ...data }, userEmail }),

  deactivate: (id: number, userEmail: string): Promise<{ id: number }> =>
    call<{ id: number }>({ action: "DEACTIVATE", data: { id }, userEmail }),
};
