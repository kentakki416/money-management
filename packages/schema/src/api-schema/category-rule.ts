import { z } from "zod"

// ========================================================
// 自動分類ルール共通スキーマ（マスター）
// ========================================================

/**
 * マッチタイプスキーマ
 */
export const matchTypeSchema = z.enum(["PARTIAL", "EXACT"])

export type MatchType = z.infer<typeof matchTypeSchema>

/**
 * 自動分類ルールスキーマ（マスター）
 */
export const categoryRuleSchema = z.object({
  category_id: z.number(),
  category_name: z.string().optional(),
  created_at: z.string(),
  id: z.number(),
  keyword: z.string(),
  match_type: matchTypeSchema,
  priority: z.number(),
  updated_at: z.string(),
})

export type CategoryRule = z.infer<typeof categoryRuleSchema>

// ========================================================
// GET /api/category-rules - 自動分類ルール一覧取得
// ========================================================

/**
 * 自動分類ルール一覧取得のレスポンススキーマ
 */
export const getCategoryRuleListResponseSchema = z.object({
  rules: z.array(categoryRuleSchema),
})

export type GetCategoryRuleListResponse = z.infer<typeof getCategoryRuleListResponseSchema>

// ========================================================
// POST /api/category-rules - 自動分類ルール作成
// ========================================================

/**
 * 自動分類ルール作成のリクエストスキーマ
 */
export const createCategoryRuleRequestSchema = z.object({
  category_id: z.number().int(),
  keyword: z.string().min(1).max(200),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type CreateCategoryRuleRequest = z.infer<typeof createCategoryRuleRequestSchema>

/**
 * 自動分類ルール作成のレスポンススキーマ
 */
export const createCategoryRuleResponseSchema = z.object({
  rule: categoryRuleSchema,
})

export type CreateCategoryRuleResponse = z.infer<typeof createCategoryRuleResponseSchema>

// ========================================================
// PUT /api/category-rules/:id - 自動分類ルール更新
// ========================================================

/**
 * 自動分類ルール更新のリクエストスキーマ
 */
export const updateCategoryRuleRequestSchema = z.object({
  category_id: z.number().int().optional(),
  keyword: z.string().min(1).max(200).optional(),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type UpdateCategoryRuleRequest = z.infer<typeof updateCategoryRuleRequestSchema>

/**
 * 自動分類ルール更新のレスポンススキーマ
 */
export const updateCategoryRuleResponseSchema = z.object({
  rule: categoryRuleSchema,
})

export type UpdateCategoryRuleResponse = z.infer<typeof updateCategoryRuleResponseSchema>

// ========================================================
// DELETE /api/category-rules/:id - 自動分類ルール削除
// ========================================================

/**
 * 自動分類ルール削除のレスポンススキーマ
 */
export const deleteCategoryRuleResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteCategoryRuleResponse = z.infer<typeof deleteCategoryRuleResponseSchema>
