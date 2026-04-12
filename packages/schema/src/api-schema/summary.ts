import { z } from "zod"

// ========================================================
// GET /api/summary/monthly - 月間カテゴリ別集計
// ========================================================

/**
 * 月間集計のリクエストスキーマ
 */
export const monthlySummaryRequestSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
})

export type MonthlySummaryRequest = z.infer<typeof monthlySummaryRequestSchema>

/**
 * カテゴリ別集計スキーマ
 */
export const categorySummarySchema = z.object({
  amount: z.number(),
  category_color: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  percentage: z.number(),
})

export type CategorySummary = z.infer<typeof categorySummarySchema>

/**
 * 月間集計のレスポンススキーマ
 */
export const monthlySummaryResponseSchema = z.object({
  categories: z.array(categorySummarySchema),
  month: z.number(),
  total_amount: z.number(),
  year: z.number(),
})

export type MonthlySummaryResponse = z.infer<typeof monthlySummaryResponseSchema>

// ========================================================
// GET /api/summary/calendar - カレンダー用日別集計
// ========================================================

/**
 * カレンダー集計のリクエストスキーマ
 */
export const calendarSummaryRequestSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
})

export type CalendarSummaryRequest = z.infer<typeof calendarSummaryRequestSchema>

/**
 * 日別集計スキーマ
 */
export const dailySummarySchema = z.object({
  amount: z.number(),
  date: z.string(),
  transaction_count: z.number(),
})

export type DailySummary = z.infer<typeof dailySummarySchema>

/**
 * カレンダー集計のレスポンススキーマ
 */
export const calendarSummaryResponseSchema = z.object({
  days: z.array(dailySummarySchema),
  month: z.number(),
  total_amount: z.number(),
  year: z.number(),
})

export type CalendarSummaryResponse = z.infer<typeof calendarSummaryResponseSchema>

// ========================================================
// GET /api/summary/trend - 月次推移（折れ線グラフ用）
// ========================================================

/**
 * 月次推移のリクエストスキーマ
 */
export const trendRequestSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
})

export type TrendRequest = z.infer<typeof trendRequestSchema>

/**
 * 月次推移ポイントスキーマ
 */
export const monthlyTrendPointSchema = z.object({
  amount: z.number(),
  month: z.number(),
  year: z.number(),
})

export type MonthlyTrendPoint = z.infer<typeof monthlyTrendPointSchema>

/**
 * カテゴリ別月次推移スキーマ
 */
export const categoryTrendSchema = z.object({
  category_color: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  data: z.array(monthlyTrendPointSchema),
})

export type CategoryTrend = z.infer<typeof categoryTrendSchema>

/**
 * 月次推移のレスポンススキーマ
 */
export const trendResponseSchema = z.object({
  categories: z.array(categoryTrendSchema),
  months: z.array(z.object({
    month: z.number(),
    year: z.number(),
  })),
  total: z.array(monthlyTrendPointSchema),
})

export type TrendResponse = z.infer<typeof trendResponseSchema>
