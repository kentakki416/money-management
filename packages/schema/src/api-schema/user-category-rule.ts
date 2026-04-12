import { z } from "zod"

import { matchTypeSchema } from "./category-rule"

// ========================================================
// ユーザー個別分類ルール共通スキーマ
// ========================================================

/**
 * ユーザー個別分類ルールスキーマ
 */
export const userCategoryRuleSchema = z.object({
  category_id: z.number(),
  category_name: z.string().optional(),
  created_at: z.string(),
  id: z.number(),
  keyword: z.string(),
  match_type: matchTypeSchema,
  priority: z.number(),
  updated_at: z.string(),
  user_id: z.number(),
})

export type UserCategoryRule = z.infer<typeof userCategoryRuleSchema>

// ========================================================
// GET /api/user-category-rules - ユーザールール一覧取得
// ========================================================

/**
 * ユーザールール一覧取得のレスポンススキーマ
 */
export const getUserCategoryRuleListResponseSchema = z.object({
  rules: z.array(userCategoryRuleSchema),
})

export type GetUserCategoryRuleListResponse = z.infer<typeof getUserCategoryRuleListResponseSchema>

// ========================================================
// POST /api/user-category-rules - ユーザールール作成
// ========================================================

/**
 * ユーザールール作成のリクエストスキーマ
 */
export const createUserCategoryRuleRequestSchema = z.object({
  category_id: z.number().int(),
  keyword: z.string().min(1).max(200),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type CreateUserCategoryRuleRequest = z.infer<typeof createUserCategoryRuleRequestSchema>

/**
 * ユーザールール作成のレスポンススキーマ
 */
export const createUserCategoryRuleResponseSchema = z.object({
  rule: userCategoryRuleSchema,
})

export type CreateUserCategoryRuleResponse = z.infer<typeof createUserCategoryRuleResponseSchema>

// ========================================================
// PUT /api/user-category-rules/:id - ユーザールール更新
// ========================================================

/**
 * ユーザールール更新のリクエストスキーマ
 */
export const updateUserCategoryRuleRequestSchema = z.object({
  category_id: z.number().int().optional(),
  keyword: z.string().min(1).max(200).optional(),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type UpdateUserCategoryRuleRequest = z.infer<typeof updateUserCategoryRuleRequestSchema>

/**
 * ユーザールール更新のレスポンススキーマ
 */
export const updateUserCategoryRuleResponseSchema = z.object({
  rule: userCategoryRuleSchema,
})

export type UpdateUserCategoryRuleResponse = z.infer<typeof updateUserCategoryRuleResponseSchema>

// ========================================================
// DELETE /api/user-category-rules/:id - ユーザールール削除
// ========================================================

/**
 * ユーザールール削除のレスポンススキーマ
 */
export const deleteUserCategoryRuleResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteUserCategoryRuleResponse = z.infer<typeof deleteUserCategoryRuleResponseSchema>
