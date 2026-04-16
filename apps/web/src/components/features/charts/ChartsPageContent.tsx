"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import React, { useCallback, useState } from "react"

import type { MonthlySummaryResponse, TrendResponse } from "@repo/api-schema"

import CategoryBreakdown from "./CategoryBreakdown"
import TrendChart from "./TrendChart"

type Props = {
  initialMonthlyData: MonthlySummaryResponse
  trendData: TrendResponse
}

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

export default function ChartsPageContent({ initialMonthlyData, trendData }: Props) {
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData)
  const [year, setYear] = useState(initialMonthlyData.year)
  const [month, setMonth] = useState(initialMonthlyData.month)
  const [isLoading, setIsLoading] = useState(false)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  /**
   * 指定した年月の月間集計データを取得する
   */
  const fetchMonthlyData = useCallback(async (targetYear: number, targetMonth: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/summary/monthly?year=${targetYear}&month=${targetMonth}`)
      const newData: MonthlySummaryResponse = await res.json()
      setMonthlyData(newData)
      setYear(targetYear)
      setMonth(targetMonth)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const goToPreviousMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    fetchMonthlyData(newYear, newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    fetchMonthlyData(newYear, newMonth)
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    fetchMonthlyData(now.getFullYear(), now.getMonth() + 1)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        グラフ
      </h1>

      {/* 月間カテゴリ別集計 */}
      <div className="space-y-4">
        {/* 月切り替え */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            disabled={isLoading}
            onClick={goToPreviousMonth}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {year}年{month}月
            </span>
            {(year !== currentYear || month !== currentMonth) && (
              <button
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                disabled={isLoading}
                onClick={goToCurrentMonth}
              >
                今月に戻る
              </button>
            )}
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            disabled={isLoading}
            onClick={goToNextMonth}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* 合計金額 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">月間支出合計</div>
          <div className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
            {formatAmount(monthlyData.total_amount)}
          </div>
        </div>

        {/* カテゴリ別内訳 */}
        <CategoryBreakdown
          categories={monthlyData.categories}
          isLoading={isLoading}
          totalAmount={monthlyData.total_amount}
        />
      </div>

      {/* 月次推移 */}
      <TrendChart trendData={trendData} />
    </div>
  )
}
