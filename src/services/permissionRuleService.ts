import type { Role } from "../contexts/PermissionContext";
import { trimTrailingWhitespaceDeep } from "../utils/trimData";

const URL = import.meta.env.VITE_API_PERMISSION_SETTING_URL as
  | string
  | undefined;

export type PermissionResourceType =
  | "Page"
  | "Button"
  | "Field"
  | "Function"
  | "Section";

export type PermissionAction =
  | "View"
  | "Create"
  | "Edit"
  | "Delete"
  | "Export"
  | "Approve"
  | "Click"
  | "Use"
  | "Manage";

export interface PermissionRule {
  id: number;
  Title: string;
  ResourceType: PermissionResourceType;
  ResourceKey: string;
  Action: PermissionAction;
  AllowedRoles: Role[];
  IsActive: boolean;
  Description?: string;
  SortOrder?: number;
}

export interface PermissionLookup {
  ResourceType: PermissionResourceType;
  ResourceKey: string;
  Action: PermissionAction;
}

export interface CreatePermissionRuleInput extends PermissionLookup {
  Title?: string;
  AllowedRoles: Role[];
  IsActive: boolean;
  Description?: string;
  SortOrder?: number;
}

function normalizeChoice(value: unknown): string {
  if (typeof value === "string") return value;
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.Value === "string") return obj.Value;
    if (typeof obj.value === "string") return obj.value;
  }
  return "";
}

function normalizeRoles(value: unknown): Role[] {
  const rawRoles = Array.isArray(value)
    ? value
    : value !== null &&
        typeof value === "object" &&
        Array.isArray((value as Record<string, unknown>).results)
      ? ((value as Record<string, unknown>).results as unknown[])
      : [];

  return rawRoles
    .map(normalizeChoice)
    .filter((role): role is Role =>
      ["User", "Admin", "Global Admin", "Developer"].includes(role),
    );
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() !== "false";
  return value !== false;
}

function normalizeRule(item: unknown): PermissionRule {
  const obj = item as Record<string, unknown>;
  return {
    id: Number(obj.ID ?? obj.Id ?? obj.id ?? 0),
    Title: String(obj.Title ?? ""),
    ResourceType: normalizeChoice(obj.ResourceType) as PermissionResourceType,
    ResourceKey: String(obj.ResourceKey ?? ""),
    Action: normalizeChoice(obj.Action) as PermissionAction,
    AllowedRoles: normalizeRoles(obj.AllowedRoles),
    IsActive: normalizeBoolean(obj.IsActive),
    Description:
      obj.Description == null ? undefined : String(obj.Description),
    SortOrder: obj.SortOrder == null ? undefined : Number(obj.SortOrder),
  };
}

function unwrapItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data !== null && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.value)) return obj.value;
    if (Array.isArray(obj.Value)) return obj.Value;
  }
  return [];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

async function call<T>(body: object): Promise<T> {
  if (!URL) {
    throw new Error(
      "PermissionRules API URL is not configured. Add VITE_API_PERMISSION_SETTING_URL to your local .env file and restart npm run dev.",
    );
  }

  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trimTrailingWhitespaceDeep(body)),
  });
  if (!res.ok) throw new Error(`permissionRuleService error: ${res.status}`);

  const json = await res.json();
  if (json != null && typeof json === "object" && "success" in json) {
    if (!json.success) throw new Error(json.error?.message ?? "API error");
    return json.data as T;
  }
  return json as T;
}

export const permissionRuleService = {
  findAll: async (
    options: { includeInactive?: boolean } = {},
  ): Promise<PermissionRule[]> => {
    const data = await call<unknown>({
      action: "GET_ALL",
      data: { includeInactive: options.includeInactive ?? false },
    });
    return unwrapItems(data).map(normalizeRule);
  },

  findOne: async (input: PermissionLookup): Promise<PermissionRule | null> => {
    const data = await call<unknown>({
      action: "GET_PERMISSION",
      data: input,
    });
    const items = unwrapItems(data);
    if (items.length > 0) return normalizeRule(items[0]);
    if (isObject(data) && !Array.isArray((data as Record<string, unknown>).value)) {
      return normalizeRule(data);
    }
    return null;
  },

  create: (
    data: CreatePermissionRuleInput,
    userEmail: string,
  ): Promise<PermissionRule> =>
    call<unknown>({ action: "CREATE", data, userEmail }).then(normalizeRule),

  update: (
    id: number,
    data: Partial<CreatePermissionRuleInput>,
    userEmail: string,
  ): Promise<PermissionRule> =>
    call<unknown>({ action: "UPDATE", data: { id, ...data }, userEmail }).then(
      normalizeRule,
    ),

  disable: (id: number, userEmail: string): Promise<PermissionRule> =>
    call<unknown>({
      action: "DELETE",
      data: { id, IsActive: false },
      userEmail,
    }).then(normalizeRule),
};
