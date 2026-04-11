const URL = import.meta.env.VITE_API_PERMISSIONS_URL as string;

export type UserRole = "Developer" | "Global Admin" | "Admin" | "User";
export type UserStatus = "Active" | "Pending" | "Inactive";

export interface SPUser {
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
}

export async function getRole(email: string): Promise<UserRole> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "GET_ROLE", email }),
  });
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`);
  const json = await res.json();
  // PA flow returns: {"success":true,"data":{"value":[{"Title":"email","Role":"Global Admin"}]}}
  if (
    json?.success &&
    Array.isArray(json.data?.value) &&
    json.data.value.length > 0
  ) {
    const item = json.data.value[0];
    return (item.Role ?? item.role) as UserRole;
  }
  // Fallback: direct {"role":"..."} format
  return (json.data?.role ?? json.role) as UserRole;
}

export async function getAllUsers(): Promise<SPUser[]> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "GET_ALL_USERS" }),
  });
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`);
  const json = await res.json();
  const items: unknown[] = Array.isArray(json.data?.value)
    ? json.data.value
    : [];
  return items.map((item: unknown) => {
    const i = item as Record<string, string>;
    return {
      email: i.Title ?? i.title ?? "",
      displayName: i.DisplayName ?? i.displayName ?? i.Title ?? "",
      role: (i.Role ?? i.role ?? "User") as UserRole,
      status: (i.Status ?? i.status ?? "Active") as UserStatus,
    };
  });
}

export async function updateUser(
  email: string,
  fields: Partial<Pick<SPUser, "role" | "status" | "displayName">>,
): Promise<void> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "UPDATE_USER",
      data: {
        Title: email,
        Role: fields.role,
        DisplayName: fields.displayName,
        Status: fields.status,
      },
    }),
  });
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`);
}
