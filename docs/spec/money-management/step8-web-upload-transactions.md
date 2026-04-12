# Step8: Web - サイドバー・CSVアップロード・取引一覧

Web画面にAdmin同様の折りたたみサイドバーを導入し、CSVアップロードと取引一覧画面を実装する。

## 対応内容

### 1. サイドバー Context

Admin の `features/sidebar/sidebar.context.tsx` を `apps/web/src/features/sidebar/` にコピーして利用する。同一パターン。

### 2. サイドバーコンポーネント

`apps/web/src/components/layout/AppSidebar.tsx` を作成（Adminを参考）:

```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useSidebar } from "@/features/sidebar/sidebar.context"

// アイコンは lucide-react または heroicons を使用
// pnpm add lucide-react
import {
  BarChart3,
  Calendar,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  List,
  Upload,
} from "lucide-react"

type NavItem = {
  icon: React.ReactNode
  name: string
  path?: string
  subItems?: { name: string; path: string }[]
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "ダッシュボード",
    path: "/",
  },
  {
    icon: <Calendar size={20} />,
    name: "カレンダー",
    path: "/calendar",
  },
  {
    icon: <BarChart3 size={20} />,
    name: "グラフ",
    path: "/charts",
  },
  {
    icon: <List size={20} />,
    name: "取引一覧",
    path: "/transactions",
  },
  {
    icon: <Upload size={20} />,
    name: "CSVアップロード",
    path: "/upload",
  },
  {
    icon: <CreditCard size={20} />,
    name: "支払い元管理",
    path: "/payment-sources",
  },
]

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar()
  const pathname = usePathname()

  const isActive = useCallback((path: string) => path === pathname, [pathname])

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${isExpanded || isMobileOpen ? "w-[260px]" : isHovered ? "w-[260px]" : "w-[70px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="text-lg font-bold text-gray-800 dark:text-white">
          {isExpanded || isHovered || isMobileOpen ? "Money Manager" : "MM"}
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((nav) => (
          <Link
            key={nav.name}
            href={nav.path ?? "/"}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
              ${isActive(nav.path ?? "/")
                ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              }
              ${!isExpanded && !isHovered ? "lg:justify-center" : ""}
            `}
          >
            <span className="flex-shrink-0">{nav.icon}</span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span>{nav.name}</span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

### 3. ダッシュボードレイアウト

`apps/web/src/app/(dashboard)/layout.tsx` を作成:

```tsx
"use client"
import React from "react"

import AppHeader from "@/components/layout/AppHeader"
import AppSidebar from "@/components/layout/AppSidebar"
import { Backdrop } from "@/components/layout/Backdrop"
import { SidebarProvider, useSidebar } from "@/features/sidebar/sidebar.context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()

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

### 4. APIクライアント

`apps/web/src/lib/api-client.ts` を作成（Admin版と同様 + 認証トークン対応）:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

const getAuthHeaders = (): HeadersInit => {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const apiClient = {
  delete: async (path: string) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { ...getAuthHeaders() },
      method: "DELETE",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { ...getAuthHeaders() },
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      method: "POST",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  put: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      method: "PUT",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: formData,
      headers: { ...getAuthHeaders() },
      method: "POST",
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(errorData.error || `API error: ${res.status}`)
    }
    return res.json() as Promise<T>
  },
}
```

### 5. CSVアップロード画面

`apps/web/src/app/(dashboard)/upload/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  CsvUploadResponse,
  GetCsvUploadListResponse,
  GetPaymentSourceListResponse,
  PaymentSource,
} from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function UploadPage() {
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([])
  const [selectedSourceId, setSelectedSourceId] = useState<number | "">("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ error?: string; success?: string } | null>(null)
  const [uploadHistory, setUploadHistory] = useState<GetCsvUploadListResponse["csv_uploads"]>([])

  const fetchData = useCallback(async () => {
    const [sources, history] = await Promise.all([
      apiClient.get<GetPaymentSourceListResponse>("/api/payment-sources"),
      apiClient.get<GetCsvUploadListResponse>("/api/csv-uploads"),
    ])
    setPaymentSources(sources.payment_sources)
    setUploadHistory(history.csv_uploads)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpload = async () => {
    if (!file || !selectedSourceId) return

    setUploading(true)
    setResult(null)

    try {
      const source = paymentSources.find((s) => s.id === selectedSourceId)
      if (!source) return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("payment_source_id", String(source.id))
      formData.append("payment_source_type", source.type)

      const response = await apiClient.upload<CsvUploadResponse>("/api/csv-upload", formData)
      setResult({ success: `${response.imported_count}件の取引を登録しました` })
      setFile(null)
      await fetchData()
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "アップロードに失敗しました" })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">CSVアップロード</h1>

      {/* アップロードフォーム */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          CSVファイルをアップロード
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              支払い元
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">選択してください</option>
              {paymentSources
                .filter((s) => s.type !== "MANUAL")
                .map((source) => (
                  <option key={source.id} value={source.id}>
                    {source.name} ({source.type})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              CSVファイル
            </label>
            <input
              accept=".csv"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-1 file:text-sm file:font-medium file:text-brand-600 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <button
            className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            disabled={!file || !selectedSourceId || uploading}
            onClick={handleUpload}
          >
            {uploading ? "アップロード中..." : "アップロード"}
          </button>

          {result?.success && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
              {result.success}
            </div>
          )}
          {result?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
              {result.error}
            </div>
          )}
        </div>
      </div>

      {/* アップロード履歴 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          アップロード履歴
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">ファイル名</th>
                <th className="px-4 py-3">支払い元</th>
                <th className="px-4 py-3">取込件数</th>
                <th className="px-4 py-3">アップロード日時</th>
              </tr>
            </thead>
            <tbody>
              {uploadHistory.map((upload) => (
                <tr
                  key={upload.id}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="px-4 py-3 text-gray-800 dark:text-white">{upload.file_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {upload.payment_source_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{upload.row_count}件</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(upload.uploaded_at).toLocaleString("ja-JP")}
                  </td>
                </tr>
              ))}
              {uploadHistory.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-gray-400"
                    colSpan={4}
                  >
                    アップロード履歴がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

### 6. 取引一覧 + 手動登録画面

`apps/web/src/app/(dashboard)/transactions/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  Category,
  CreateTransactionRequest,
  GetCategoryListResponse,
  GetPaymentSourceListResponse,
  GetTransactionListResponse,
  PaymentSource,
  Transaction,
} from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)

  // フィルタ
  const now = new Date()
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("")

  // 手動登録フォーム
  const [form, setForm] = useState<CreateTransactionRequest>({
    amount: 0,
    description: "",
    payment_source_id: 0,
    transaction_date: new Date().toISOString().split("T")[0]!,
  })

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams({
      month: String(filterMonth),
      year: String(filterYear),
    })
    if (filterCategoryId) params.set("category_id", String(filterCategoryId))

    const data = await apiClient.get<GetTransactionListResponse>(
      `/api/transactions?${params.toString()}`
    )
    setTransactions(data.transactions)
    setTotalAmount(data.total_amount)
  }, [filterYear, filterMonth, filterCategoryId])

  const fetchMasterData = useCallback(async () => {
    const [catData, srcData] = await Promise.all([
      apiClient.get<GetCategoryListResponse>("/api/categories"),
      apiClient.get<GetPaymentSourceListResponse>("/api/payment-sources"),
    ])
    setCategories(catData.categories)
    setPaymentSources(srcData.payment_sources)
  }, [])

  useEffect(() => {
    fetchMasterData()
  }, [fetchMasterData])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleCreateTransaction = async () => {
    await apiClient.post("/api/transactions", form)
    setIsFormOpen(false)
    setForm({
      amount: 0,
      description: "",
      payment_source_id: paymentSources[0]?.id ?? 0,
      transaction_date: new Date().toISOString().split("T")[0]!,
    })
    await fetchTransactions()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("この取引を削除しますか？")) return
    await apiClient.delete(`/api/transactions/${id}`)
    await fetchTransactions()
  }

  const handleCategoryChange = async (txId: number, categoryId: number) => {
    await apiClient.put(`/api/transactions/${txId}`, { category_id: categoryId })
    await fetchTransactions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">取引一覧</h1>
        <button
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          手動登録
        </button>
      </div>

      {/* 手動登録フォーム */}
      {isFormOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">取引を手動登録</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">日付</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                type="date"
                value={form.transaction_date}
                onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">説明</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">金額</label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min="1"
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">支払い元</label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.payment_source_id}
                onChange={(e) => setForm({ ...form, payment_source_id: parseInt(e.target.value, 10) })}
              >
                <option value={0}>選択</option>
                {paymentSources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                disabled={!form.description || !form.amount || !form.payment_source_id}
                onClick={handleCreateTransaction}
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フィルタ */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filterMonth}
            onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">全カテゴリ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto text-lg font-bold text-gray-800 dark:text-white">
          合計: {totalAmount.toLocaleString()}円
        </div>
      </div>

      {/* 取引テーブル */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">日付</th>
                <th className="px-4 py-3">説明</th>
                <th className="px-4 py-3">カテゴリ</th>
                <th className="px-4 py-3">支払い元</th>
                <th className="px-4 py-3 text-right">金額</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {tx.transaction_date}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-white">
                    {tx.description}
                    {tx.is_manual && (
                      <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        手動
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded border border-gray-200 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      value={tx.category_id ?? ""}
                      onChange={(e) => handleCategoryChange(tx.id, Number(e.target.value))}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {tx.payment_source_name}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800 dark:text-white">
                    {tx.amount.toLocaleString()}円
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-sm text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(tx.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-400" colSpan={6}>
                    取引データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

### 7. パッケージ追加

```bash
cd apps/web
pnpm add lucide-react
```

## 動作確認

### 画面確認

```bash
pnpm dev  # ルートから全アプリ起動
```

1. `http://localhost:3000` にアクセス → サイドバー付きレイアウト表示
2. サイドバーの折りたたみ・ホバー展開が動作する
3. `/upload` でCSVアップロードが正常に動作する
4. `/transactions` で取引一覧が表示される
5. 手動取引登録が動作する
6. カテゴリの変更がインラインで動作する
7. 取引削除が動作する
8. フィルタ（年月・カテゴリ）で取引を絞り込める
