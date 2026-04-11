const URL = import.meta.env.VITE_API_PERMISSIONS_URL as string

export type UserRole = 'Developer' | 'Global Admin' | 'Admin' | 'User'

export async function getRole(email: string): Promise<UserRole> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'GET_ROLE', email }),
  })
  if (!res.ok) throw new Error(`permissionService error: ${res.status}`)
  const data = await res.json() as { role: UserRole }
  return data.role
}
