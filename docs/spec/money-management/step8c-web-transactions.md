# Step8c: Web - 取引一覧・手動登録画面

取引一覧の表示、フィルタ、手動登録、カテゴリ変更、削除機能を実装する。

## 対応内容

### 1. ページ（Server Component）

`apps/web/src/app/(dashboard)/transactions/page.tsx` を新規作成。

Server Component として初期データ（カテゴリ一覧、支払い元一覧、当月の取引一覧）をサーバー間通信で取得し、Client Component に props で渡す。

```tsx
import type {
  GetCategoryListResponse,
  GetPaymentSourceListResponse,
  GetTransactionListResponse,
} from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [categoriesData, sourcesData, transactionsData] = await Promise.all([
    apiClient.get<GetCategoryListResponse>("/api/categories"),
    apiClient.get<GetPaymentSourceListResponse>("/api/payment-sources"),
    apiClient.get<GetTransactionListResponse>(
      `/api/transactions?year=${year}&month=${month}`
    ),
  ])

  return (
    <div className="space-y-6">
      <TransactionPageContent
        categories={categoriesData.categories}
        initialTransactions={transactionsData.transactions}
        initialTotalAmount={transactionsData.total_amount}
        paymentSources={sourcesData.payment_sources}
      />
    </div>
  )
}
```

### 2. Route Handler（フィルタ用データ取得）

`apps/web/src/app/api/transactions/route.ts` を新規作成。

年月・カテゴリのフィルタ切り替え時に Client Component から動的にデータを再取得するための Route Handler。Server Action はデータ取得に使わない。

```typescript
import { NextRequest, NextResponse } from "next/server"

import { apiClient } from "@/libs/api-client"

export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams()

  const year = searchParams.get("year")
  const month = searchParams.get("month")
  const categoryId = searchParams.get("category_id")

  if (year) params.set("year", year)
  if (month) params.set("month", month)
  if (categoryId) params.set("category_id", categoryId)

  const data = await apiClient.get(`/api/transactions?${params.toString()}`)
  return NextResponse.json(data)
}
```

### 3. Server Action（取引の作成・更新・削除）

`apps/web/src/app/(dashboard)/transactions/actions.ts` を新規作成。

```typescript
"use server"

import { revalidatePath } from "next/cache"

import type { CreateTransactionRequest, UpdateTransactionRequest } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * 取引を手動作成する
 */
export const createTransaction = async (data: CreateTransactionRequest) => {
  await apiClient.post("/api/transactions", data)
  revalidatePath("/transactions")
}

/**
 * 取引を更新する（カテゴリ変更等）
 */
export const updateTransaction = async (id: number, data: UpdateTransactionRequest) => {
  await apiClient.put(`/api/transactions/${id}`, data)
  revalidatePath("/transactions")
}

/**
 * 取引を削除する
 */
export const deleteTransaction = async (id: number) => {
  await apiClient.delete(`/api/transactions/${id}`)
  revalidatePath("/transactions")
}
```

### 4. 取引一覧コンテンツ（Client Component）

`apps/web/src/components/features/transaction/TransactionPageContent.tsx` を新規作成。

```tsx
"use client"

import type {
  Category,
  GetTransactionListResponse,
  PaymentSource,
  Transaction,
} from "@repo/api-schema"

interface TransactionPageContentProps {
  categories: Category[]
  initialTotalAmount: number
  initialTransactions: Transaction[]
  paymentSources: PaymentSource[]
}
```

機能:
- **フィルタ**: 年月・カテゴリのドロップダウン → Route Handler (`/api/transactions?...`) で再取得
- **手動登録フォーム**: トグル表示 → Server Action (`createTransaction`) で作成
- **カテゴリ変更**: インラインのセレクトボックス → Server Action (`updateTransaction`) で更新
- **取引削除**: 確認ダイアログ後 → Server Action (`deleteTransaction`) で削除

| 操作 | 方式 | API パス |
|------|------|---------|
| 初期取引一覧 | Server Component（props） | `GET /api/transactions` |
| フィルタ切替 | Route Handler | `GET /api/transactions?year=&month=&category_id=` |
| カテゴリ一覧 | Server Component（props） | `GET /api/categories` |
| 支払い元一覧 | Server Component（props） | `GET /api/payment-sources` |
| 取引手動作成 | Server Action | `POST /api/transactions` |
| カテゴリ変更 | Server Action | `PUT /api/transactions/:id` |
| 取引削除 | Server Action | `DELETE /api/transactions/:id` |

### 5. テーブルカラム構成

| カラム | 内容 |
|-------|------|
| 日付 | `tx.transaction_date` |
| 説明 | `tx.description` + 手動登録バッジ（`tx.is_manual`） |
| カテゴリ | セレクトボックス（インライン変更可） |
| 支払い元 | `tx.payment_source_name` |
| 金額 | `tx.amount.toLocaleString()` 円（右寄せ） |
| 操作 | 削除ボタン |

### 6. 型定義

`@repo/api-schema` から以下をインポート:
- `Category`, `CreateTransactionRequest`, `GetCategoryListResponse`, `GetPaymentSourceListResponse`, `GetTransactionListResponse`, `PaymentSource`, `Transaction`, `UpdateTransactionRequest`

## 動作確認

```bash
cd apps/web && pnpm build
```

1. `http://localhost:3000/transactions` にアクセス
2. 当月の取引一覧テーブルが表示される
3. 年月フィルタを変更すると取引一覧が更新される
4. カテゴリフィルタで絞り込める
5. 「手動登録」ボタンでフォームが開閉する
6. 手動取引登録が動作する
7. カテゴリのインライン変更が動作する
8. 取引削除が確認ダイアログ後に動作する
9. 合計金額がフィルタに連動して更新される
