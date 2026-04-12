import { z } from "zod"

// ========================================================
// カテゴリ共通スキーマ
// ========================================================

/**
 * カテゴリスキーマ
 */
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string()
})

export type Category = z.infer<typeof categorySchema>

// ========================================================
// GET /api/cateogrys - カテゴリー一覧取得
// ========================================================

/**
 * カテゴリー一覧取得のレスポンススキーマ
 */
export const getCategoryListResponseSchema = z.object({
  categories: z.array(categorySchema),
})

export type GetCategoryListResponse = z.infer<typeof getCategoryListResponseSchema>

// ========================================================
// POST /api/categories - カテゴリー作成
// ========================================================

/**
 * カテゴリー作成のリクエストスキーマ
 */
export const createCategoryRequestSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string().min(1).max(50),
  sort_order : z.number().int().min(0).optional(),
})

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>

/**
 * カテゴリー作成のレスポンススキーマ
 */
export const createCategoryResponse = z.object({
  category: categorySchema,
})

export type CreateCategoryReponse = z.infer<typeof createCategoryResponse>

// ========================================================
// PUT /api/categories/:id - カテゴリー更新
// ========================================================

/**
 * カテゴリー更新のリクエストスキーマ
 */
export const updateCategoryRequestSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  name: z.string().min(1).max(50).optional(),
  sort_order: z.number().int().min(0).optional()
})

export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>

/**
 * カテゴリー更新のレスポンススキーマ
 */
export const updateCategoryResponseSchema = z.object({
  category: categorySchema
})

export type UpdateCategoryResponse = z.infer<typeof updateCategoryResponseSchema>