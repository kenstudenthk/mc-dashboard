import type { Role } from "../contexts/PermissionContext";

const BASE_URL = import.meta.env.VITE_API_QUICK_LINKS_URL as string;

export interface QuickLink {
  id: number;
  Title: string;
  URL: string;
  Description: string;
  IsActive?: boolean;
  VisibleRoles?: Role[];
}

export interface CreateQuickLinkInput {
  Title: string;
  URL: string;
  Description: string;
  IsActive?: boolean;
  VisibleRoles?: Role[];
}

// SharePoint Hyperlink columns return { Url: string, Description: string }
// instead of a plain string — normalise to the Url string.
function normalizeSharePointUrl(val: unknown): string {
  if (typeof val === "string") return val;
  if (val !== null && typeof val === "object") {
    const o = val as Record<string, unknown>;
    if (typeof o.Url === "string") return o.Url;
    if (typeof o.url === "string") return o.url;
  }
  return "";
}

function normalizeSharePointChoices(val: unknown): Role[] | undefined {
  const choices =
    Array.isArray(val)
      ? val
      : val !== null &&
          typeof val === "object" &&
          Array.isArray((val as Record<string, unknown>).results)
        ? ((val as Record<string, unknown>).results as unknown[])
        : undefined;
  if (!choices) return undefined;
  return choices
    .map((item) => {
      if (typeof item === "string") return item;
      if (item !== null && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        if (typeof obj.Value === "string") return obj.Value;
        if (typeof obj.value === "string") return obj.value;
      }
      return "";
    })
    .filter((role): role is Role =>
      ["User", "Admin", "Global Admin", "Developer"].includes(role),
    );
}

function withId(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(withId);
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = { ...obj };
    if ("ID" in obj) result.id = obj.ID;
    if ("URL" in obj) result.URL = normalizeSharePointUrl(obj.URL);
    if ("IsActive" in obj) result.IsActive = obj.IsActive !== false;
    if ("VisibleRoles" in obj) result.VisibleRoles = normalizeSharePointChoices(obj.VisibleRoles);
    return result;
  }
  return data;
}

async function call<T>(body: object): Promise<T> {
  if (!BASE_URL) {
    throw new Error("Quick Links API URL is not configured.");
  }
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(`Quick Links API error: ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (!text.trim()) return undefined as T;
  const json = JSON.parse(text);
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    if (Array.isArray(json.data?.value))
      return withId(json.data.value as T) as T;
    if (json.data != null) return withId(json.data as T) as T;
  }
  return withId(json as T) as T;
}

export const quickLinkService = {
  findAll: () => call<QuickLink[]>({ action: "GET_ALL" }),

  create: (data: CreateQuickLinkInput, userEmail: string) =>
    call<QuickLink>({ action: "CREATE", data, userEmail }),

  update: (
    id: number,
    data: Partial<CreateQuickLinkInput>,
    userEmail: string,
  ) => call<QuickLink>({ action: "UPDATE", data: { id, ...data }, userEmail }),

  delete: (id: number, userEmail: string) =>
    call<void>({ action: "DELETE", data: { id }, userEmail }),
};
