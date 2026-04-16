import { cookies } from "next/headers"

const API_BASE_URL = process.env.API_URL || "http://localhost:8080"
const AUTH_TOKEN_COOKIE = "auth_token"

/**
 * Cookie から認証トークンを読み取り、Authorization ヘッダーを生成する
 */
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value
  if (token) {
    return { Authorization: `Bearer ${token}` }
  }
  return {}
}

export const apiClient = {
  delete: async <T = unknown>(path: string): Promise<T> => {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { ...authHeaders },
      method: "DELETE",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  get: async <T>(path: string): Promise<T> => {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { ...authHeaders },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...authHeaders },
      method: "POST",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  put: async <T>(path: string, body: unknown): Promise<T> => {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...authHeaders },
      method: "PUT",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const authHeaders = await getAuthHeaders()
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: formData,
      headers: { ...authHeaders },
      method: "POST",
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(errorData.error || `API error: ${res.status}`)
    }
    return res.json() as Promise<T>
  },
}
