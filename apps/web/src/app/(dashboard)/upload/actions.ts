"use server"

import { revalidatePath } from "next/cache"

import type { DeleteCsvUploadResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * CSV アップロードとそれに紐づく取引を削除する
 * 返却値には削除した取引件数が含まれる
 */
export const deleteCsvUpload = async (id: number): Promise<DeleteCsvUploadResponse> => {
  const res = await apiClient.delete<DeleteCsvUploadResponse>(`/api/csv-uploads/${id}`)
  revalidatePath("/upload")
  return res
}
