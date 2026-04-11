const URL = import.meta.env.VITE_API_PERMISSIONS_URL as string;

export type UserRole = "Developer" | "Global Admin" | "Admin" | "User";

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
