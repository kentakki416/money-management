"use client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import React, { useCallback, useState } from "react"

import type { CalendarSummaryResponse, DailySummary } from "@repo/api-schema"

type Props = {
  initialData: CalendarSummaryResponse
}

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

/**
 * 日別支出の色クラスを返す（金額に応じた濃淡）
 */
const getAmountColorClass = (amount: number): string => {
  if (amount === 0) return ""
  if (amount < 1000) return "bg-brand-50 dark:bg-brand-900/20"
  if (amount < 5000) return "bg-brand-100 dark:bg-brand-900/40"
  if (amount < 10000) return "bg-orange-50 dark:bg-orange-900/20"
  return "bg-red-50 dark:bg-red-900/20"
}

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

export default function CalendarPageContent({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  const [year, setYear] = useState(initialData.year)
  const [month, setMonth] = useState(initialData.month)
  const [isLoading, setIsLoading] = useState(false)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  /**
   * 指定した年月のカレンダーデータを取得する
   */
  const fetchCalendarData = useCallback(async (targetYear: number, targetMonth: number) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/summary/calendar?year=${targetYear}&month=${targetMonth}`)
      const newData: CalendarSummaryResponse = await res.json()
      setData(newData)
      setYear(targetYear)
      setMonth(targetMonth)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * 前月に移動する
   */
  const goToPreviousMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    fetchCalendarData(newYear, newMonth)
  }

  /**
   * 翌月に移動する
   */
  const goToNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    fetchCalendarData(newYear, newMonth)
  }

  /**
   * 今月に移動する
   */
  const goToCurrentMonth = () => {
    const now = new Date()
    fetchCalendarData(now.getFullYear(), now.getMonth() + 1)
  }

  /**
   * 日別集計データのマップを作成する
   */
  const dayMap = new Map<string, DailySummary>()
  data.days.forEach((day) => dayMap.set(day.date, day))

  /**
   * カレンダーのグリッドを生成する
   */
  const firstDayOfMonth = new Date(year, month - 1, 1)
  const startDayOfWeek = firstDayOfMonth.getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  const calendarCells: (DailySummary | null)[] = []

  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    calendarCells.push(dayMap.get(dateStr) ?? { amount: 0, date: dateStr, transaction_count: 0 })
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          カレンダー
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          月間合計: <span className="font-semibold text-gray-900 dark:text-white">{formatAmount(data.total_amount)}</span>
        </div>
      </div>

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
            {year === currentYear && month === currentMonth
              ? "今月"
              : `${year}年${month}月`}
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

      {/* カレンダーグリッド */}
      <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${isLoading ? "opacity-50" : ""}`}>
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {WEEKDAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`py-3 text-center text-xs font-semibold ${
                i === 0
                  ? "text-red-500"
                  : i === 6
                    ? "text-blue-500"
                    : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7">
          {calendarCells.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[80px] border-b border-r border-gray-100 bg-gray-50/50 dark:border-gray-700/50 dark:bg-gray-800/50 md:min-h-[100px]"
                />
              )
            }

            const dayOfMonth = parseInt(cell.date.split("-")[2])
            const dayOfWeek = new Date(cell.date).getDay()

            return (
              <div
                key={cell.date}
                className={`min-h-[80px] border-b border-r border-gray-100 p-1.5 transition-colors dark:border-gray-700/50 md:min-h-[100px] md:p-2 ${getAmountColorClass(cell.amount)}`}
              >
                <div
                  className={`text-xs font-medium md:text-sm ${
                    dayOfWeek === 0
                      ? "text-red-500"
                      : dayOfWeek === 6
                        ? "text-blue-500"
                        : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {dayOfMonth}
                </div>
                {cell.amount > 0 && (
                  <div className="mt-1 space-y-0.5">
                    <div className="text-xs font-semibold text-gray-900 dark:text-white md:text-sm">
                      {formatAmount(cell.amount)}
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 md:text-xs">
                      {cell.transaction_count}件
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
