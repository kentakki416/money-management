import { z } from "zod"

/**
 * エラーレスポンススキーマ（全エンドポイント共通）
 */
export const errorResponseSchema = z.object({
  error: z.string(),
  status_code: z.number(),
})

export type ErrorResponse = z.infer<typeof errorResponseSchema>

export * from "./auth"
export * from "./category"
export * from "./category-rule"
export * from "./csv-upload"
export * from "./health"
export * from "./memo"
export * from "./payment-source"
export * from "./summary"
export * from "./transaction"
export * from "./user"
export * from "./user-category-rule"