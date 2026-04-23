"use client"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import React, { useCallback, useState } from "react"

import type { MonthlySummaryResponse, TrendResponse } from "@repo/api-schema"

import CategoryBreakdown from "./CategoryBreakdown"
import TrendChart, { TOTAL_LINE_ID } from "./TrendChart"

type Props = {
  initialMonthlyData: MonthlySummaryResponse
  trendData: TrendResponse
}

type ViewMode = "month" | "year"

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

export default function ChartsPageContent({ initialMonthlyData, trendData }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [monthlyData, setMonthlyData] = useState(initialMonthlyData)
  const [year, setYear] = useState(initialMonthlyData.year)
  const [month, setMonth] = useState(initialMonthlyData.month)
  const [isLoading, setIsLoading] = useState(false)
  const [trendHiddenIds, setTrendHiddenIds] = useState<Set<number>>(new Set())
  const [monthlyHiddenIds, setMonthlyHiddenIds] = useState<Set<number>>(new Set())
  const [isYearlyBreakdownOpen, setIsYearlyBreakdownOpen] = useState(false)

  /**
   * 指定したIDの表示/非表示を切り替える
   */
  const toggleId = (setter: React.Dispatch<React.SetStateAction<Set<number>>>) =>
    (id: number) => {
      setter((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
    }

  const toggleTrendLine = toggleId(setTrendHiddenIds)
  const toggleMonthlyCategory = toggleId(setMonthlyHiddenIds)

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

  /**
   * カテゴリごとの年間合計を計算する
   */
  const yearlyCategoryTotals = trendData.categories.map((cat) => ({
    amount: cat.data.reduce((s, p) => s + p.amount, 0),
    category_color: cat.category_color,
    category_id: cat.category_id,
    category_name: cat.category_name,
  }))
  const yearlyGrandTotal = trendData.total.reduce((sum, m) => sum + m.amount, 0)

  /**
   * 年間の合計金額を計算する（合計ラインが表示されていれば総合計、そうでなければ表示中カテゴリの合計）
   */
  const isTrendTotalVisible = !trendHiddenIds.has(TOTAL_LINE_ID)
  const yearlyTotal = isTrendTotalVisible
    ? yearlyGrandTotal
    : yearlyCategoryTotals
      .filter((cat) => !trendHiddenIds.has(cat.category_id))
      .reduce((sum, cat) => sum + cat.amount, 0)
  const isTrendFiltered =
    !isTrendTotalVisible ||
    trendData.categories.some((cat) => trendHiddenIds.has(cat.category_id))

  /**
   * 月間の合計金額を計算する（表示中カテゴリのみ合計）
   */
  const visibleMonthlyCategories = monthlyData.categories.filter(
    (cat) => !monthlyHiddenIds.has(cat.category_id)
  )
  const monthlyFilteredTotal = visibleMonthlyCategories.reduce(
    (sum, cat) => sum + cat.amount,
    0
  )
  const isMonthlyFiltered = monthlyData.categories.some((cat) =>
    monthlyHiddenIds.has(cat.category_id)
  )

  return (
    <div className="space-y-3">
      {/* ヘッダー + 表示モード切り替え */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">
          グラフ
        </h1>
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
          <button
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "month"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
            onClick={() => setViewMode("month")}
          >
            月別
          </button>
          <button
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              viewMode === "year"
                ? "bg-brand-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
            onClick={() => setViewMode("year")}
          >
            年別
          </button>
        </div>
      </div>

      {viewMode === "month" ? (
        <div className="space-y-3">
          {/* 月切り替え */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
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
              {year === currentYear && month === currentMonth ? (
                <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  今月
                </span>
              ) : (
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

          {/* カテゴリ別内訳（円グラフ）+ 月間支出合計 */}
          <CategoryBreakdown
            categories={monthlyData.categories}
            filteredTotal={monthlyFilteredTotal}
            hiddenIds={monthlyHiddenIds}
            isFiltered={isMonthlyFiltered}
            isLoading={isLoading}
            totalAmount={monthlyData.total_amount}
            onToggleCategory={toggleMonthlyCategory}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* 年間合計 */}
          <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                年間支出合計（過去12ヶ月）
                {isTrendFiltered && (
                  <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
                    選択中
                  </span>
                )}
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {formatAmount(yearlyTotal)}
              </div>
            </div>

            {/* カテゴリ別の年間合計（折りたたみ） */}
            {yearlyCategoryTotals.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  aria-expanded={isYearlyBreakdownOpen}
                  className="flex w-full items-center justify-between px-4 py-1.5 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700/40"
                  onClick={() => setIsYearlyBreakdownOpen((prev) => !prev)}
                >
                  <span>カテゴリ別の年間合計（クリックで表示を切り替え）</span>
                  {isYearlyBreakdownOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                {isYearlyBreakdownOpen && (
                  <div className="divide-y divide-gray-100 px-4 pb-4 dark:divide-gray-700">
                    {yearlyCategoryTotals.map((cat) => {
                      const isVisible = !trendHiddenIds.has(cat.category_id)
                      const percentage =
                        yearlyGrandTotal > 0 ? (cat.amount / yearlyGrandTotal) * 100 : 0
                      return (
                        <button
                          key={cat.category_id}
                          className={`flex w-full items-center justify-between py-3 text-left first:pt-0 last:pb-0 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                            isVisible ? "" : "opacity-40"
                          }`}
                          onClick={() => toggleTrendLine(cat.category_id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: isVisible ? cat.category_color : "transparent",
                                border: `2px solid ${cat.category_color}`,
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {cat.category_name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatAmount(cat.amount)}
                            </span>
                            <span className="w-14 text-right text-xs text-gray-500 dark:text-gray-400">
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 年間推移グラフ */}
          <TrendChart
            hiddenIds={trendHiddenIds}
            trendData={trendData}
            onToggleLine={toggleTrendLine}
          />
        </div>
      )}
    </div>
  )
}
