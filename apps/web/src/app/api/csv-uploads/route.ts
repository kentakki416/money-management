import { NextRequest, NextResponse } from "next/server"

import type { GetCsvUploadListResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * アップロード履歴一覧を取得する
 */
export const GET = async () => {
  const data = await apiClient.get<GetCsvUploadListResponse>("/api/csv-uploads")
  return NextResponse.json(data)
}

/**
 * CSVファイルをアップロードする
 */
export const POST = async (request: NextRequest) => {
  const formData = await request.formData()
  const result = await apiClient.upload("/api/csv-uploads", formData)
  return NextResponse.json(result)
}
