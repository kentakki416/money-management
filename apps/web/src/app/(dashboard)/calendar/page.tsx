import type { Metadata } from "next"

import type { CalendarSummaryResponse } from "@repo/api-schema"

import CalendarPageContent from "@/components/features/calendar/CalendarPageContent"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "日別の支出をカレンダーで確認",
  title: "カレンダー | Money Manager",
}

export const dynamic = "force-dynamic"

export default async function CalendarPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const data = await apiClient.get<CalendarSummaryResponse>(
    `/api/summary/calendar?year=${year}&month=${month}`
  )

  return (
    <div className="space-y-6">
      <CalendarPageContent initialData={data} />
    </div>
  )
}
