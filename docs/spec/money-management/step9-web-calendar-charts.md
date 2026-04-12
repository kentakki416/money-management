# Step9: Web - ダッシュボード・カレンダー・グラフ画面

ダッシュボード（月間サマリー）、カレンダー（日別支出）、グラフ（カテゴリ別推移）の3画面を実装する。

## 対応内容

### 1. パッケージ追加

```bash
cd apps/web
pnpm add recharts
```

Recharts を使用してグラフを描画する。Admin の Chart.js パターンとは異なるが、React との親和性が高い Recharts を採用する。

### 2. ダッシュボード画面

`apps/web/src/app/(dashboard)/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type {
  GetTransactionListResponse,
  MonthlySummaryResponse,
  Transaction,
} from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function DashboardPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [summary, setSummary] = useState<MonthlySummaryResponse | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])

  const fetchData = useCallback(async () => {
    const [summaryData, txData] = await Promise.all([
      apiClient.get<MonthlySummaryResponse>(
        `/api/summary/monthly?year=${year}&month=${month}`
      ),
      apiClient.get<GetTransactionListResponse>(
        `/api/transactions?year=${year}&month=${month}`
      ),
    ])
    setSummary(summaryData)
    setRecentTransactions(txData.transactions.slice(0, 10))
  }, [year, month])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const chartData = summary?.categories.map((c) => ({
    amount: c.amount,
    color: c.category_color,
    name: c.category_name,
  })) ?? []

  return (
    <div className="space-y-6">
      {/* 月選択ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ダッシュボード</h1>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={handlePrevMonth}
          >
            &lt;
          </button>
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {year}年{month}月
          </span>
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={handleNextMonth}
          >
            &gt;
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">月間合計</p>
          <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">
            {(summary?.total_amount ?? 0).toLocaleString()}円
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">カテゴリ数</p>
          <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-white">
            {summary?.categories.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">最も多い出費</p>
          <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white">
            {summary?.categories[0]?.category_name ?? "-"}
          </p>
          <p className="text-sm text-gray-500">
            {(summary?.categories[0]?.amount ?? 0).toLocaleString()}円
            ({summary?.categories[0]?.percentage ?? 0}%)
          </p>
        </div>
      </div>

      {/* カテゴリ別棒グラフ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          カテゴリ別支出
        </h2>
        <div className="h-80">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                type="number"
              />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()}円`, "金額"]}
              />
              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell fill={entry.color} key={index} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近の取引 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          最近の取引
        </h2>
        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: tx.category_color ?? "#CCC" }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-500">{tx.transaction_date}</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {tx.amount.toLocaleString()}円
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 3. カレンダー画面

`apps/web/src/app/(dashboard)/calendar/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  CalendarSummaryResponse,
  DailySummary,
  GetTransactionListResponse,
  Transaction,
} from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [calendarData, setCalendarData] = useState<CalendarSummaryResponse | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayTransactions, setDayTransactions] = useState<Transaction[]>([])

  const fetchCalendar = useCallback(async () => {
    const data = await apiClient.get<CalendarSummaryResponse>(
      `/api/summary/calendar?year=${year}&month=${month}`
    )
    setCalendarData(data)
  }, [year, month])

  useEffect(() => {
    fetchCalendar()
  }, [fetchCalendar])

  const handleDateClick = async (date: string) => {
    setSelectedDate(date)
    const data = await apiClient.get<GetTransactionListResponse>(
      `/api/transactions?date=${date}`
    )
    setDayTransactions(data.transactions)
  }

  const handlePrevMonth = () => {
    if (month === 1) { setYear(year - 1); setMonth(12) }
    else { setMonth(month - 1) }
  }

  const handleNextMonth = () => {
    if (month === 12) { setYear(year + 1); setMonth(1) }
    else { setMonth(month + 1) }
  }

  // カレンダーグリッド生成
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = firstDay.getDay() // 0=Sun
  const daysInMonth = lastDay.getDate()

  const dayMap = new Map<string, DailySummary>()
  calendarData?.days.forEach((d) => dayMap.set(d.date, d))

  const calendarCells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  const getAmountColor = (amount: number) => {
    if (amount >= 10000) return "text-red-600 dark:text-red-400"
    if (amount >= 5000) return "text-orange-500 dark:text-orange-400"
    return "text-gray-600 dark:text-gray-300"
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">カレンダー</h1>
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={handlePrevMonth}
          >
            &lt;
          </button>
          <span className="text-lg font-semibold text-gray-800 dark:text-white">
            {year}年{month}月
          </span>
          <button
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
            onClick={handleNextMonth}
          >
            &gt;
          </button>
        </div>
        <div className="text-lg font-bold text-gray-800 dark:text-white">
          合計: {(calendarData?.total_amount ?? 0).toLocaleString()}円
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {["日", "月", "火", "水", "木", "金", "土"].map((dow) => (
            <div
              key={dow}
              className="px-2 py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {dow}
            </div>
          ))}
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7">
          {calendarCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[80px] border-b border-r border-gray-100 dark:border-gray-700" />
            }

            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            const daySummary = dayMap.get(dateStr)
            const isSelected = selectedDate === dateStr

            return (
              <div
                key={dateStr}
                className={`min-h-[80px] cursor-pointer border-b border-r border-gray-100 p-2 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50
                  ${isSelected ? "bg-brand-50 dark:bg-brand-500/10" : ""}
                `}
                onClick={() => handleDateClick(dateStr)}
              >
                <span className="text-sm text-gray-600 dark:text-gray-300">{day}</span>
                {daySummary && (
                  <div className="mt-1">
                    <p className={`text-sm font-semibold ${getAmountColor(daySummary.amount)}`}>
                      {daySummary.amount.toLocaleString()}円
                    </p>
                    <p className="text-xs text-gray-400">{daySummary.transaction_count}件</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 日付の取引詳細モーダル */}
      {selectedDate && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {selectedDate} の取引
            </h2>
            <button
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              onClick={() => setSelectedDate(null)}
            >
              閉じる
            </button>
          </div>
          {dayTransactions.length === 0 ? (
            <p className="text-gray-400">取引がありません</p>
          ) : (
            <div className="space-y-3">
              {dayTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: tx.category_color ?? "#CCC" }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {tx.category_name} / {tx.payment_source_name}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {tx.amount.toLocaleString()}円
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

### 4. グラフ画面（折れ線グラフ）

`apps/web/src/app/(dashboard)/charts/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { TrendResponse } from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function ChartsPage() {
  const [months, setMonths] = useState(12)
  const [trend, setTrend] = useState<TrendResponse | null>(null)
  const [showTotal, setShowTotal] = useState(true)
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(new Set())

  const fetchTrend = useCallback(async () => {
    const data = await apiClient.get<TrendResponse>(`/api/summary/trend?months=${months}`)
    setTrend(data)
    // 初期表示: 全カテゴリを表示
    setVisibleCategories(new Set(data.categories.map((c) => c.category_id)))
  }, [months])

  useEffect(() => {
    fetchTrend()
  }, [fetchTrend])

  const toggleCategory = (categoryId: number) => {
    setVisibleCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Recharts用データ変換: 月をX軸、各カテゴリが列になるpivot形式
  const chartData = trend?.months.map((m) => {
    const row: Record<string, number | string> = {
      label: `${m.year}/${String(m.month).padStart(2, "0")}`,
    }

    // 合計
    const totalPoint = trend.total.find((t) => t.year === m.year && t.month === m.month)
    row.合計 = totalPoint?.amount ?? 0

    // カテゴリ別
    for (const cat of trend.categories) {
      const point = cat.data.find((d) => d.year === m.year && d.month === m.month)
      row[cat.category_name] = point?.amount ?? 0
    }

    return row
  }) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">支出推移</h1>
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          value={months}
          onChange={(e) => setMonths(parseInt(e.target.value, 10))}
        >
          <option value={6}>過去6ヶ月</option>
          <option value={12}>過去12ヶ月</option>
          <option value={24}>過去24ヶ月</option>
        </select>
      </div>

      {/* 折れ線グラフ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          カテゴリ別月次推移
        </h2>
        <div className="h-96">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis
                fontSize={12}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()}円`,
                  name,
                ]}
              />
              <Legend />

              {/* 合計ライン */}
              {showTotal && (
                <Line
                  dataKey="合計"
                  dot={false}
                  stroke="#333333"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  type="monotone"
                />
              )}

              {/* カテゴリ別ライン */}
              {trend?.categories
                .filter((cat) => visibleCategories.has(cat.category_id))
                .map((cat) => (
                  <Line
                    dataKey={cat.category_name}
                    dot={{ r: 3 }}
                    key={cat.category_id}
                    stroke={cat.category_color}
                    strokeWidth={2}
                    type="monotone"
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* カテゴリフィルタ */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
          表示カテゴリ
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
              showTotal
                ? "border-gray-800 bg-gray-800 text-white dark:border-gray-300 dark:bg-gray-300 dark:text-gray-900"
                : "border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400"
            }`}
            onClick={() => setShowTotal(!showTotal)}
          >
            合計
          </button>
          {trend?.categories.map((cat) => (
            <button
              key={cat.category_id}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                visibleCategories.has(cat.category_id)
                  ? "text-white"
                  : "text-gray-600 dark:text-gray-400"
              }`}
              style={{
                backgroundColor: visibleCategories.has(cat.category_id)
                  ? cat.category_color
                  : "transparent",
                borderColor: cat.category_color,
              }}
              onClick={() => toggleCategory(cat.category_id)}
            >
              {cat.category_name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 動作確認

### 画面確認

```bash
pnpm dev
```

1. `http://localhost:3000/` ダッシュボード
   - 月間合計・カテゴリ数・最大出費カテゴリが表示される
   - カテゴリ別の横棒グラフが描画される
   - 最近の取引リストが表示される
   - 前月/翌月の切り替えが動作する

2. `http://localhost:3000/calendar` カレンダー
   - 月カレンダーに日別支出額が表示される
   - 金額に応じて色分け（赤:1万以上、橙:5千以上、灰:それ以下）
   - 日付クリックでその日の取引詳細が下部に表示される
   - 前月/翌月の切り替えが動作する

3. `http://localhost:3000/charts` グラフ
   - カテゴリ別の月次推移が折れ線グラフで表示される
   - 合計の破線ラインが表示される
   - カテゴリフィルタで表示/非表示を切り替えられる
   - 表示期間（6/12/24ヶ月）を変更できる
   - ツールチップで金額が表示される
