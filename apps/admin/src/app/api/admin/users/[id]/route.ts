import { NextRequest, NextResponse } from "next/server"

import { apiClient } from "@/libs/api-client"

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const user = await apiClient.get(`/api/admin/users/${id}`)
  return NextResponse.json(user)
}
