/**
 * カテゴリ別集計
 */
export type CategorySummary = {
  amount: number
  categoryColor: string
  categoryId: number
  categoryName: string
}

/**
 * 日別集計
 */
export type DailySummary = {
  amount: number
  date: string
  transactionCount: number
}

/**
 * 月次カテゴリ別推移
 */
export type MonthlyTrend = {
  amount: number
  categoryColor: string
  categoryId: number
  categoryName: string
  month: number
  year: number
}
