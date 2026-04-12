import { z } from "zod"

// ========================================================
// 取引共通スキーマ
// ========================================================

/**
 * 取引スキーマ
 */
export const transactionSchema = z.object({
  amount: z.number(),
  category_color: z.string().nullable().optional(),
  category_id: z.number().nullable(),
  category_name: z.string().nullable().optional(),
  created_at: z.string(),
  csv_upload_id: z.number().nullable(),
  description: z.string(),
  id: z.number(),
  is_manual: z.boolean(),
  payment_source_id: z.number(),
  payment_source_name: z.string().optional(),
  transaction_date: z.string(),
  updated_at: z.string(),
  user_id: z.number(),
})

export type Transaction = z.infer<typeof transactionSchema>

// ========================================================
// GET /api/transactions - 取引一覧取得（フィルタ付き）
// ========================================================

/**
 * 取引一覧取得のリクエストスキーマ
 */
export const getTransactionListRequestSchema = z.object({
  category_id: z.coerce.number().int().optional(),
  date: z.string().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  payment_source_id: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
})

export type GetTransactionListRequest = z.infer<typeof getTransactionListRequestSchema>

/**
 * 取引一覧取得のレスポンススキーマ
 */
export const getTransactionListResponseSchema = z.object({
  total_amount: z.number(),
  transactions: z.array(transactionSchema),
})

export type GetTransactionListResponse = z.infer<typeof getTransactionListResponseSchema>

// ========================================================
// POST /api/transactions - 取引手動作成
// ========================================================

/**
 * 取引手動作成のリクエストスキーマ
 */
export const createTransactionRequestSchema = z.object({
  amount: z.number().int().min(1),
  category_id: z.number().int().optional(),
  description: z.string().min(1).max(500),
  payment_source_id: z.number().int(),
  transaction_date: z.string(),
})

export type CreateTransactionRequest = z.infer<typeof createTransactionRequestSchema>

/**
 * 取引手動作成のレスポンススキーマ
 */
export const createTransactionResponseSchema = z.object({
  transaction: transactionSchema,
})

export type CreateTransactionResponse = z.infer<typeof createTransactionResponseSchema>

// ========================================================
// PUT /api/transactions/:id - 取引更新
// ========================================================

/**
 * 取引更新のリクエストスキーマ
 */
export const updateTransactionRequestSchema = z.object({
  amount: z.number().int().min(1).optional(),
  category_id: z.number().int().nullable().optional(),
  description: z.string().min(1).max(500).optional(),
  transaction_date: z.string().optional(),
})

export type UpdateTransactionRequest = z.infer<typeof updateTransactionRequestSchema>

/**
 * 取引更新のレスポンススキーマ
 */
export const updateTransactionResponseSchema = z.object({
  transaction: transactionSchema,
})

export type UpdateTransactionResponse = z.infer<typeof updateTransactionResponseSchema>

// ========================================================
// DELETE /api/transactions/:id - 取引削除
// ========================================================

/**
 * 取引削除のレスポンススキーマ
 */
export const deleteTransactionResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteTransactionResponse = z.infer<typeof deleteTransactionResponseSchema>
