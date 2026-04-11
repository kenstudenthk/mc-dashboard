const URL = import.meta.env.VITE_API_QUICK_LINKS_URL as string

export interface QuickLink {
  id: number
  Title: string
  URL: string
  Description: string
}

export interface CreateQuickLinkInput {
  Title: string
  URL: string
  Description: string
}

async function call<T>(body: object): Promise<T> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`quickLinkService error: ${res.status}`)
  return res.json() as Promise<T>
}

export const quickLinkService = {
  findAll: () =>
    call<QuickLink[]>({ action: 'GET_ALL' }),

  create: (data: CreateQuickLinkInput, userEmail: string) =>
    call<QuickLink>({ action: 'CREATE', data, userEmail }),

  update: (id: number, data: Partial<CreateQuickLinkInput>, userEmail: string) =>
    call<QuickLink>({ action: 'UPDATE', data: { id, ...data }, userEmail }),

  delete: (id: number, userEmail: string) =>
    call<void>({ action: 'DELETE', data: { id }, userEmail }),
}
