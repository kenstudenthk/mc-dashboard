const BASE_URL = import.meta.env.VITE_API_QUICK_LINKS_URL as string;
console.log("[quickLinkService] BASE_URL =", BASE_URL || "(empty)");

export interface QuickLink {
  id: number;
  Title: string;
  URL: string;
  Description: string;
}

export interface CreateQuickLinkInput {
  Title: string;
  URL: string;
  Description: string;
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
  if (!BASE_URL) {
    throw new Error(
      "Quick Links API URL is not configured. Set VITE_API_QUICK_LINKS_URL in .env.local.",
    );
  }
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(`Quick Links API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
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
