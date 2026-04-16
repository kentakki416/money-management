import { z } from "zod"

import { paymentSourceTypeSchema } from "./payment-source"

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
 * CSVアップロードのリクエストボディスキーマ（multipart form の文字列フィールド部分）
 * ファイル本体は multer が `req.file` として扱うため、ここでは body の文字列のみ検証する
 */
export const csvUploadRequestSchema = z.object({
  payment_source_id: z.coerce.number().int().positive(),
  payment_source_type: paymentSourceTypeSchema,
})

export type CsvUploadRequest = z.infer<typeof csvUploadRequestSchema>

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

// ========================================================
// DELETE /api/csv-uploads/:id - CSVアップロード削除（関連取引も一緒に削除）
// ========================================================

/**
 * CSVアップロード削除の路径パラメータスキーマ
 */
export const deleteCsvUploadPathParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type DeleteCsvUploadPathParam = z.infer<typeof deleteCsvUploadPathParamSchema>

/**
 * CSVアップロード削除のレスポンススキーマ
 * 削除した取引件数もユーザーに伝える
 */
export const deleteCsvUploadResponseSchema = z.object({
  deleted_transaction_count: z.number(),
  success: z.boolean(),
})

export type DeleteCsvUploadResponse = z.infer<typeof deleteCsvUploadResponseSchema>
