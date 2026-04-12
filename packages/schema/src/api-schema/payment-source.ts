import { z } from "zod"

// ========================================================
// 支払い元共通スキーマ
// ========================================================

/**
 * 支払い元タイプスキーマ
 */
export const paymentSourceTypeSchema = z.enum(["SMBC", "MUFG", "PAYPAY", "MANUAL"])

export type PaymentSourceType = z.infer<typeof paymentSourceTypeSchema>

/**
 * 支払い元スキーマ
 */
export const paymentSourceSchema = z.object({
  created_at: z.string(),
  id: z.number(),
  name: z.string(),
  type: paymentSourceTypeSchema,
  user_id: z.number(),
})

export type PaymentSource = z.infer<typeof paymentSourceSchema>

// ========================================================
// GET /api/payment-sources - 支払い元一覧取得
// ========================================================

/**
 * 支払い元一覧取得のレスポンススキーマ
 */
export const getPaymentSourceListResponseSchema = z.object({
  payment_sources: z.array(paymentSourceSchema),
})

export type GetPaymentSourceListResponse = z.infer<typeof getPaymentSourceListResponseSchema>

// ========================================================
// POST /api/payment-sources - 支払い元作成
// ========================================================

/**
 * 支払い元作成のリクエストスキーマ
 */
export const createPaymentSourceRequestSchema = z.object({
  name: z.string().min(1).max(100),
  type: paymentSourceTypeSchema,
})

export type CreatePaymentSourceRequest = z.infer<typeof createPaymentSourceRequestSchema>

/**
 * 支払い元作成のレスポンススキーマ
 */
export const createPaymentSourceResponseSchema = z.object({
  payment_source: paymentSourceSchema,
})

export type CreatePaymentSourceResponse = z.infer<typeof createPaymentSourceResponseSchema>

// ========================================================
// DELETE /api/payment-sources/:id - 支払い元削除
// ========================================================

/**
 * 支払い元削除のレスポンススキーマ
 */
export const deletePaymentSourceResponseSchema = z.object({
  success: z.boolean(),
})

export type DeletePaymentSourceResponse = z.infer<typeof deletePaymentSourceResponseSchema>
