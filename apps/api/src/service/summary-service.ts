import { logger } from "../log"
import { SummaryRepository } from "../repository/mysql"
import { CategorySummary, DailySummary } from "../types/domain"
import { ok, Result } from "../types/result"

/**
 * 月間カテゴリ別集計を取得する（割合付き）
 */
export const getMonthlySummary = async (
  userId: number,
  year: number,
  month: number,
  summaryRepository: SummaryRepository
): Promise<Result<{
  categories: (CategorySummary & { percentage: number })[]
  month: number
  totalAmount: number
  year: number
}>> => {
  logger.debug("SummaryService: Fetching monthly summary", { month, userId, year })

  const categories = await summaryRepository.getMonthlyCategorySummary(userId, year, month)
  const totalAmount = categories.reduce((sum, c) => sum + c.amount, 0)

  const categoriesWithPercentage = categories.map((c) => ({
    ...c,
    percentage: totalAmount > 0 ? Math.round((c.amount / totalAmount) * 1000) / 10 : 0,
  }))

  logger.debug("SummaryService: Monthly summary fetched", {
    categoryCount: categories.length,
    totalAmount,
  })

  return ok({ categories: categoriesWithPercentage, month, totalAmount, year })
}

/**
 * カレンダー用日別集計を取得する
 */
export const getCalendarSummary = async (
  userId: number,
  year: number,
  month: number,
  summaryRepository: SummaryRepository
): Promise<Result<{
  days: DailySummary[]
  month: number
  totalAmount: number
  year: number
}>> => {
  logger.debug("SummaryService: Fetching calendar summary", { month, userId, year })

  const days = await summaryRepository.getDailySummary(userId, year, month)
  const totalAmount = days.reduce((sum, d) => sum + d.amount, 0)

  logger.debug("SummaryService: Calendar summary fetched", { dayCount: days.length, totalAmount })

  return ok({ days, month, totalAmount, year })
}

/**
 * 過去N月のカテゴリ別月次推移を取得する
 * 欠損月は0で補完する
 */
export const getTrend = async (
  userId: number,
  months: number,
  summaryRepository: SummaryRepository
): Promise<Result<{
  categories: {
    categoryColor: string
    categoryId: number
    categoryName: string
    data: { amount: number; month: number; year: number }[]
  }[]
  months: { month: number; year: number }[]
  total: { amount: number; month: number; year: number }[]
}>> => {
  logger.debug("SummaryService: Fetching trend", { months, userId })

  const trendData = await summaryRepository.getMonthlyTrend(userId, months)

  const now = new Date()
  const monthLabels: { month: number; year: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push({ month: d.getMonth() + 1, year: d.getFullYear() })
  }

  const categoryMap = new Map<
    number,
    { categoryColor: string; categoryId: number; categoryName: string; data: Map<string, number> }
  >()

  for (const row of trendData) {
    const existing = categoryMap.get(row.categoryId)
    const key = `${row.year}-${row.month}`
    if (existing) {
      existing.data.set(key, (existing.data.get(key) ?? 0) + row.amount)
    } else {
      const dataMap = new Map<string, number>()
      dataMap.set(key, row.amount)
      categoryMap.set(row.categoryId, {
        categoryColor: row.categoryColor,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        data: dataMap,
      })
    }
  }

  const totalByMonth = new Map<string, number>()
  for (const label of monthLabels) {
    totalByMonth.set(`${label.year}-${label.month}`, 0)
  }
  for (const row of trendData) {
    const key = `${row.year}-${row.month}`
    totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + row.amount)
  }

  const categories = Array.from(categoryMap.values()).map((cat) => ({
    categoryColor: cat.categoryColor,
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    data: monthLabels.map((label) => ({
      amount: cat.data.get(`${label.year}-${label.month}`) ?? 0,
      month: label.month,
      year: label.year,
    })),
  }))

  const total = monthLabels.map((label) => ({
    amount: totalByMonth.get(`${label.year}-${label.month}`) ?? 0,
    month: label.month,
    year: label.year,
  }))

  logger.debug("SummaryService: Trend fetched", { categoryCount: categories.length })

  return ok({ categories, months: monthLabels, total })
}
