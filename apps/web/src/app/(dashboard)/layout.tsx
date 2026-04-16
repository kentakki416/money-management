import { cookies } from "next/headers"

import type { User } from "@/features/auth/auth.context"

import { DashboardShell } from "./dashboard-shell"

const AUTH_USER_COOKIE = "auth_user"

/**
 * サーバー側で Cookie からユーザー情報を取得する
 */
const getUserFromCookie = async (): Promise<User | null> => {
  const cookieStore = await cookies()
  const raw = cookieStore.get(AUTH_USER_COOKIE)?.value
  if (!raw) return null
  try {
    return JSON.parse(decodeURIComponent(raw))
  } catch {
    return null
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUserFromCookie()

  return <DashboardShell user={user}>{children}</DashboardShell>
}
