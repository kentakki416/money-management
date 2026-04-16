import { NextRequest, NextResponse } from "next/server"

import type { CalendarSummaryResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * カレンダー用日別集計を取得する
 */
export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  const data = await apiClient.get<CalendarSummaryResponse>(
    `/api/summary/calendar?year=${year}&month=${month}`
  )
  return NextResponse.json(data)
}
