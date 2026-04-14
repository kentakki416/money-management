import { NextRequest, NextResponse } from "next/server"

import { apiClient } from "@/libs/api-client"

export const GET = async (request: NextRequest) => {
  const period = request.nextUrl.searchParams.get("period") || "yearly"
  const stats = await apiClient.get(`/api/admin/stats?period=${period}`)
  return NextResponse.json(stats)
}
