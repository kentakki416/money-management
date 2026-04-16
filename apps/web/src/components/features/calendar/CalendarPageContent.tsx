"use client"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import React, { useCallback, useState } from "react"

import type {
  CalendarSummaryResponse,
  DailySummary,
  GetTransactionListResponse,
  Transaction,
} from "@repo/api-schema"

type Props = {
  initialCalendarData: CalendarSummaryResponse
  initialTransactions: Transaction[]
}

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

/**
 * 取引詳細モーダル
 */
function TransactionDetailModal({
  onClose,
  transaction,
}: {
  onClose: () => void
  transaction: Transaction
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">取引詳細</h2>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">支払い先</div>
              <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">金額</div>
              <div className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{formatAmount(transaction.amount)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">日付</div>
              <div className="mt-0.5 text-sm text-gray-900 dark:text-white">{transaction.transaction_date}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">支払い元</div>
              <div className="mt-0.5">
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {transaction.payment_source_name ?? "不明"}
                </span>
              </div>
            </div>
            {transaction.category_name && (
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">カテゴリ</div>
                <div className="mt-0.5">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: transaction.category_color ? `${transaction.category_color}20` : undefined,
                      color: transaction.category_color ?? undefined,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: transaction.category_color ?? undefined }}
                    />
                    {transaction.category_name}
                  </span>
                </div>
              </div>
            )}
            {/* 取得元: 手動 / CSV アップロード由来を明示 */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400">取得元</div>
              <div className="mt-0.5">
                {transaction.csv_upload ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    title={`アップロード日時: ${new Date(transaction.csv_upload.uploaded_at).toLocaleString("ja-JP")}`}
                  >
                    📄 {transaction.csv_upload.file_name}
                  </span>
                ) : transaction.is_manual ? (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
                    ✏️ 手動で追加
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">不明</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CalendarPageContent({ initialCalendarData, initialTransactions }: Props) {
  const [calendarData, setCalendarData] = useState(initialCalendarData)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [year, setYear] = useState(initialCalendarData.year)
  const [month, setMonth] = useState(initialCalendarData.month)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  /**
   * 指定した年月のカレンダーデータと取引データを取得する
   */
  const fetchMonthData = useCallback(async (targetYear: number, targetMonth: number) => {
    setIsLoading(true)
    try {
      const [calRes, txRes] = await Promise.all([
        fetch(`/api/summary/calendar?year=${targetYear}&month=${targetMonth}`),
        fetch(`/api/transactions?year=${targetYear}&month=${targetMonth}`),
      ])
      const newCalendarData: CalendarSummaryResponse = await calRes.json()
      const newTxData: GetTransactionListResponse = await txRes.json()
      setCalendarData(newCalendarData)
      setTransactions(newTxData.transactions)
      setYear(targetYear)
      setMonth(targetMonth)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const goToPreviousMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1
    const newYear = month === 1 ? year - 1 : year
    fetchMonthData(newYear, newMonth)
  }

  const goToNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1
    const newYear = month === 12 ? year + 1 : year
    fetchMonthData(newYear, newMonth)
  }

  const goToCurrentMonth = () => {
    const now = new Date()
    fetchMonthData(now.getFullYear(), now.getMonth() + 1)
  }

  /**
   * 日別集計データのマップを作成する
   */
  const dayMap = new Map<string, DailySummary>()
  calendarData.days.forEach((day) => dayMap.set(day.date, day))

  /**
   * 日付ごとの取引マップを作成する
   */
  const transactionsByDate = new Map<string, Transaction[]>()
  transactions.forEach((t) => {
    const list = transactionsByDate.get(t.transaction_date) ?? []
    list.push(t)
    transactionsByDate.set(t.transaction_date, list)
  })

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
          月間合計: <span className="font-semibold text-gray-900 dark:text-white">{formatAmount(calendarData.total_amount)}</span>
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
            {`${year}年${month}月`}
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
                  className="min-h-[120px] border-b border-r border-gray-100 bg-gray-50/50 dark:border-gray-700/50 dark:bg-gray-800/50 md:min-h-[140px]"
                />
              )
            }

            const dayOfMonth = parseInt(cell.date.split("-")[2])
            const dayOfWeek = new Date(cell.date).getDay()
            const dayTransactions = transactionsByDate.get(cell.date) ?? []

            return (
              <div
                key={cell.date}
                className="min-h-[120px] border-b border-r border-gray-100 p-1.5 dark:border-gray-700/50 md:min-h-[140px] md:p-2"
              >
                {/* 日付番号 */}
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

                {/* 取引ボタン一覧 */}
                {dayTransactions.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayTransactions.map((t) => (
                      <button
                        key={t.id}
                        className="flex w-full items-center justify-between gap-1 rounded-md border border-gray-200 border-l-[3px] bg-white px-1.5 py-1 text-left transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
                        onClick={() => setSelectedTransaction(t)}
                        style={{ borderLeftColor: t.payment_source_color ?? "#6B7280" }}
                      >
                        <span className="min-w-0 flex-1 truncate text-[10px] text-gray-600 dark:text-gray-300 md:text-xs">
                          {/* 取得元の判別アイコン */}
                          <span className="mr-0.5" title={t.is_manual ? "手動追加" : t.csv_upload ? `CSV: ${t.csv_upload.file_name}` : "不明"}>
                            {t.is_manual ? "✏️" : t.csv_upload ? "📄" : ""}
                          </span>
                          {t.description}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-gray-900 dark:text-white md:text-xs">
                          {formatAmount(t.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 取引詳細モーダル */}
      {selectedTransaction && (
        <TransactionDetailModal
          onClose={() => setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}
    </div>
  )
}
