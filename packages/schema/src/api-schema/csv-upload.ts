import { z } from "zod"

// ========================================================
// CSVアップロード共通スキーマ
// ========================================================

/**
 * CSVアップロードスキーマ
 */
export const csvUploadSchema = z.object({
  file_hash: z.string(),
  file_name: z.string(),
  id: z.number(),
  payment_source_id: z.number(),
  payment_source_name: z.string().optional(),
  row_count: z.number(),
  uploaded_at: z.string(),
  user_id: z.number(),
})

export type CsvUpload = z.infer<typeof csvUploadSchema>

// ========================================================
// POST /api/csv-uploads - CSVアップロード
// ========================================================

/**
 * CSVアップロードのレスポンススキーマ
 */
export const csvUploadResponseSchema = z.object({
  csv_upload: csvUploadSchema,
  imported_count: z.number(),
})

export type CsvUploadResponse = z.infer<typeof csvUploadResponseSchema>

// ========================================================
// GET /api/csv-uploads - CSVアップロード履歴一覧取得
// ========================================================

/**
 * CSVアップロード履歴一覧取得のレスポンススキーマ
 */
export const getCsvUploadListResponseSchema = z.object({
  csv_uploads: z.array(csvUploadSchema),
})

export type GetCsvUploadListResponse = z.infer<typeof getCsvUploadListResponseSchema>
