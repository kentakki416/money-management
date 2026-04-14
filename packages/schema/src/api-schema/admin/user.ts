import { z } from "zod"

// ========================================================
// 共通: 管理画面ユーザー情報スキーマ
// ========================================================

/**
 * 管理画面ユーザー情報スキーマ
 */
export const adminUserSchema = z.object({
  id: z.number(),
  avatar_url: z.string().nullable(),
  csv_upload_count: z.number(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  transaction_count: z.number(),
  created_at: z.string(),
})

export type AdminUser = z.infer<typeof adminUserSchema>

// ========================================================
// GET /api/admin/users - 管理画面ユーザー一覧
// ========================================================

/**
 * 管理画面ユーザー一覧のレスポンススキーマ
 */
export const getAdminUserListResponseSchema = z.object({
  total: z.number(),
  users: z.array(adminUserSchema),
})

export type GetAdminUserListResponse = z.infer<typeof getAdminUserListResponseSchema>

// ========================================================
// GET /api/admin/users/:id - 管理画面ユーザー詳細
// ========================================================

/**
 * 管理画面ユーザー詳細のレスポンススキーマ
 */
export const getAdminUserDetailResponseSchema = z.object({
  user: adminUserSchema.extend({
    payment_sources: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        type: z.string(),
      })
    ),
  }),
})

export type GetAdminUserDetailResponse = z.infer<typeof getAdminUserDetailResponseSchema>
