import type { Metadata } from "next"

import type {
  GetCategoryListResponse,
  GetPaymentSourceListResponse,
  GetTransactionListResponse,
} from "@repo/api-schema"

import TransactionPageContent from "@/components/features/transaction/TransactionPageContent"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "取引一覧の表示・フィルタ・手動登録",
  title: "取引一覧 | Money Manager",
}

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
        initialTotalAmount={transactionsData.total_amount}
        initialTransactions={transactionsData.transactions}
        paymentSources={sourcesData.payment_sources}
      />
    </div>
  )
}
