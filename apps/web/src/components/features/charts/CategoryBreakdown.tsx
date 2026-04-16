"use client"
import React from "react"

import type { CategorySummary } from "@repo/api-schema"

type Props = {
  categories: CategorySummary[]
  isLoading: boolean
  totalAmount: number
}

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

export default function CategoryBreakdown({ categories, isLoading, totalAmount }: Props) {
  if (totalAmount === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">この月の支出データがありません</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${isLoading ? "opacity-50" : ""}`}>
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">カテゴリ別内訳</h2>
      </div>

      {/* 横棒グラフ */}
      <div className="flex h-4 overflow-hidden rounded-b-none mx-4 mt-4 rounded-lg bg-gray-100 dark:bg-gray-700">
        {categories.map((cat) => (
          <div
            key={cat.category_id}
            className="h-full transition-all duration-300"
            style={{
              backgroundColor: cat.category_color,
              width: `${cat.percentage}%`,
            }}
            title={`${cat.category_name}: ${formatAmount(cat.amount)} (${cat.percentage.toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* カテゴリリスト */}
      <div className="divide-y divide-gray-100 p-4 dark:divide-gray-700">
        {categories.map((cat) => (
          <div key={cat.category_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: cat.category_color }}
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
                {cat.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
