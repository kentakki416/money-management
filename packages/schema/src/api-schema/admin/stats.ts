import { z } from "zod"

// ========================================================
// 共通: 登録推移の期間タイプ
// ========================================================

/**
 * 登録推移の期間タイプ
 */
export const registrationPeriodSchema = z.enum(["yearly", "monthly", "weekly", "daily"])

export type RegistrationPeriod = z.infer<typeof registrationPeriodSchema>

// ========================================================
// GET /api/admin/stats - 管理画面ダッシュボード統計
// ========================================================

/**
 * 管理画面ダッシュボード統計のレスポンススキーマ
 */
export const adminStatsResponseSchema = z.object({
  registrations: z.array(
    z.object({
      count: z.number(),
      label: z.string(),
    })
  ),
  total_csv_uploads: z.number(),
  total_users: z.number(),
})

export type AdminStatsResponse = z.infer<typeof adminStatsResponseSchema>
