const URL = import.meta.env.VITE_API_PERMISSIONS_URL as string;

export type UserRole = "Developer" | "Global Admin" | "Admin" | "User";
export type UserStatus = "Active" | "Pending" | "Inactive";

export interface SPUser {
  id: number;
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
    const raw = item.Role ?? item.role;
    // SharePoint choice fields return { Value: "..." } — unwrap if needed
    return ((raw as { Value?: string })?.Value ?? raw) as UserRole;
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
    // SPO choice fields return { "@odata.type": "...", "Id": n, "Value": "..." }
    const roleRaw = i.Role ?? i.role;
    const statusRaw = i.Status ?? i.status;
    return {
      id: Number(i.ID ?? i.Id ?? 0),
      email: i.Title ?? i.title ?? "",
      displayName: i.DisplayName ?? i.displayName ?? i.Title ?? "",
      role: ((roleRaw as { Value?: string })?.Value ??
        roleRaw ??
        "User") as UserRole,
      status: ((statusRaw as { Value?: string })?.Value ??
        statusRaw ??
        "Active") as UserStatus,
    };
  });
}

export async function updateUser(
  id: number,
  email: string,
  fields: Partial<Pick<SPUser, "role" | "status" | "displayName">>,
): Promise<void> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "UPDATE_USER",
      data: {
        Id: id,
        Title: email,
        Role: fields.role,
        DisplayName: fields.displayName,
        Status: fields.status,
      },
    }),
  });
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`);
}

export async function createUser(
  email: string,
  displayName: string,
  role: UserRole,
  status: UserStatus,
): Promise<void> {
  if (!URL) throw new Error("Permissions API URL is not configured.");
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "CREATE_USER",
      data: { Title: email, DisplayName: displayName, Role: role, Status: status },
    }),
  });
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`);
}

export async function deleteUser(id: number): Promise<void> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "DELETE_USER",
      data: { Id: id },
    }),
  });
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`);
}
