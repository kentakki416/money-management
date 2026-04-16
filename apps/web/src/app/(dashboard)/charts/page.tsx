import type { Metadata } from "next"

import type { MonthlySummaryResponse, TrendResponse } from "@repo/api-schema"

import ChartsPageContent from "@/components/features/charts/ChartsPageContent"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "カテゴリ別の支出推移を分析",
  title: "グラフ | Money Manager",
}

export const dynamic = "force-dynamic"

export default async function ChartsPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const [monthlyData, trendData] = await Promise.all([
    apiClient.get<MonthlySummaryResponse>(
      `/api/summary/monthly?year=${year}&month=${month}`
    ),
    apiClient.get<TrendResponse>("/api/summary/trend?months=12"),
  ])

  return (
    <div className="space-y-6">
      <ChartsPageContent
        initialMonthlyData={monthlyData}
        trendData={trendData}
      />
    </div>
  )
}
