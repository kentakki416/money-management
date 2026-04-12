# Step10: Web - ログイン画面・認証フロー

Google OAuth によるログイン画面と、認証状態の管理（トークン保存・未認証時リダイレクト）を実装する。

## 対応内容

### 1. ログイン画面

`apps/web/src/app/(auth)/signin/page.tsx` を作成:

```tsx
"use client"
import { useRouter } from "next/navigation"
import React, { useEffect, useState } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export default function SignInPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 既にログイン済みならホームへリダイレクト
    const token = localStorage.getItem("auth_token")
    if (token) {
      router.replace("/")
    } else {
      setLoading(false)
    }
  }, [router])

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`
  }

  if (loading) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Money Manager
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            支出を可視化して家計を管理しましょう
          </p>
        </div>

        <button
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          onClick={handleGoogleLogin}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Googleでログイン
        </button>
      </div>
    </div>
  )
}
```

### 2. 認証レイアウト

`apps/web/src/app/(auth)/layout.tsx` を作成:

```tsx
import React from "react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

### 3. OAuth コールバック画面

`apps/web/src/app/(auth)/callback/page.tsx` を作成:

Google OAuth のリダイレクト先。API からトークンを受け取り、localStorage に保存してホームへ遷移する。

```tsx
"use client"
import { useRouter, useSearchParams } from "next/navigation"
import React, { Suspense, useEffect } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get("code")
    if (!code) {
      router.replace("/signin")
      return
    }

    const authenticate = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google/callback?code=${code}`)
        if (!res.ok) throw new Error("Authentication failed")

        const data = await res.json()
        localStorage.setItem("auth_token", data.token)
        router.replace("/")
      } catch {
        router.replace("/signin")
      }
    }

    authenticate()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">認証中...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  )
}
```

### 4. 認証ガード（ダッシュボードレイアウトに組み込み）

`apps/web/src/hooks/useAuth.ts` を作成:

```typescript
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import type { AuthMeResponse } from "@repo/api-schema"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const useAuth = () => {
  const router = useRouter()
  const [user, setUser] = useState<AuthMeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.replace("/signin")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Unauthorized")

      const data: AuthMeResponse = await res.json()
      setUser(data)
    } catch {
      localStorage.removeItem("auth_token")
      router.replace("/signin")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token")
    router.replace("/signin")
  }, [router])

  return { loading, logout, user }
}
```

### 5. ダッシュボードレイアウトに認証ガードを追加

`apps/web/src/app/(dashboard)/layout.tsx` を更新（step8 の既存レイアウトに `useAuth` を組み込む）:

```tsx
"use client"
import React from "react"

import AppHeader from "@/components/layout/AppHeader"
import AppSidebar from "@/components/layout/AppSidebar"
import { Backdrop } from "@/components/layout/Backdrop"
import { SidebarProvider, useSidebar } from "@/features/sidebar/sidebar.context"
import { useAuth } from "@/hooks/useAuth"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[260px]" : "lg:ml-[70px]"
        }`}
      >
        <AppHeader />
        <main className="mx-auto max-w-screen-2xl p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
```

## 動作確認

### 画面確認

```bash
pnpm dev
```

1. 未ログイン状態で `http://localhost:3000/` にアクセス → `/signin` にリダイレクトされる
2. `/signin` で「Googleでログイン」ボタンをクリック → Google OAuth 画面に遷移
3. Google認証完了後 `/callback` に戻り、トークンが保存されてホームにリダイレクト
4. ログイン済み状態で `/signin` にアクセス → ホームにリダイレクトされる
5. ブラウザの開発者ツールで localStorage から `auth_token` を削除 → 次回アクセス時に `/signin` にリダイレクト
