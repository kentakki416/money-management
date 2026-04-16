import { NextRequest, NextResponse } from "next/server"

import type { MonthlySummaryResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * 月間カテゴリ別集計を取得する
 */
export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const year = searchParams.get("year")
  const month = searchParams.get("month")

  const data = await apiClient.get<MonthlySummaryResponse>(
    `/api/summary/monthly?year=${year}&month=${month}`
  )
  return NextResponse.json(data)
}
