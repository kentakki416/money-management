import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import type { GetCsvUploadListResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

const API_BASE_URL = process.env.API_URL || "http://localhost:8080"
const AUTH_TOKEN_COOKIE = "auth_token"

/**
 * アップロード履歴一覧を取得する
 */
export const GET = async () => {
  const data = await apiClient.get<GetCsvUploadListResponse>("/api/csv-uploads")
  return NextResponse.json(data)
}

/**
 * CSVファイルをアップロードする
 * 上流API（Express）のステータスコード（特に 4xx）をそのまま透過する
 */
export const POST = async (request: NextRequest) => {
  const formData = await request.formData()
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value

  const upstreamRes = await fetch(`${API_BASE_URL}/api/csv-uploads`, {
    body: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    method: "POST",
  })

  const data = await upstreamRes.json().catch(() => ({
    error: "アップロードに失敗しました",
    status_code: upstreamRes.status,
  }))

  return NextResponse.json(data, { status: upstreamRes.status })
}
