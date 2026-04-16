import { NextRequest, NextResponse } from "next/server"

import type { GetTransactionListResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * フィルタ条件付きで取引一覧を取得する
 */
export const GET = async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const params = new URLSearchParams()

  const year = searchParams.get("year")
  const month = searchParams.get("month")
  const categoryId = searchParams.get("category_id")

  if (year) params.set("year", year)
  if (month) params.set("month", month)
  if (categoryId) params.set("category_id", categoryId)

  const data = await apiClient.get<GetTransactionListResponse>(
    `/api/transactions?${params.toString()}`
  )
  return NextResponse.json(data)
}
