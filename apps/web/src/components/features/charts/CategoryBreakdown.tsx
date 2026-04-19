"use client"
import React, { useState } from "react"

import type { CategorySummary } from "@repo/api-schema"

type Props = {
  categories: CategorySummary[]
  hiddenIds: Set<number>
  isLoading: boolean
  onToggleCategory: (id: number) => void
  totalAmount: number
}

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

/**
 * 円グラフのスライス情報
 */
type PieSlice = {
  category: CategorySummary
  labelX: number
  labelY: number
  pathData: string
}

/**
 * 円グラフのサイズ
 */
const PIE_SIZE = 240
const PIE_RADIUS = 110
const PIE_CENTER = PIE_SIZE / 2

/**
 * 円グラフのスライスを計算する
 */
const calculatePieSlices = (categories: CategorySummary[]): PieSlice[] => {
  let cumulativeAngle = -Math.PI / 2

  return categories.map((category) => {
    const sliceAngle = (category.percentage / 100) * 2 * Math.PI
    const startAngle = cumulativeAngle
    const endAngle = cumulativeAngle + sliceAngle
    cumulativeAngle = endAngle

    const startX = PIE_CENTER + PIE_RADIUS * Math.cos(startAngle)
    const startY = PIE_CENTER + PIE_RADIUS * Math.sin(startAngle)
    const endX = PIE_CENTER + PIE_RADIUS * Math.cos(endAngle)
    const endY = PIE_CENTER + PIE_RADIUS * Math.sin(endAngle)

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0

    /**
     * カテゴリが1つしかない場合は円全体を描画する
     */
    const pathData = category.percentage >= 99.9999
      ? `M ${PIE_CENTER - PIE_RADIUS} ${PIE_CENTER} A ${PIE_RADIUS} ${PIE_RADIUS} 0 1 1 ${PIE_CENTER + PIE_RADIUS} ${PIE_CENTER} A ${PIE_RADIUS} ${PIE_RADIUS} 0 1 1 ${PIE_CENTER - PIE_RADIUS} ${PIE_CENTER} Z`
      : `M ${PIE_CENTER} ${PIE_CENTER} L ${startX} ${startY} A ${PIE_RADIUS} ${PIE_RADIUS} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`

    /**
     * ラベルは中心から60%の位置に配置する
     */
    const midAngle = (startAngle + endAngle) / 2
    const labelRadius = PIE_RADIUS * 0.6
    const labelX = PIE_CENTER + labelRadius * Math.cos(midAngle)
    const labelY = PIE_CENTER + labelRadius * Math.sin(midAngle)

    return {
      category,
      labelX,
      labelY,
      pathData,
    }
  })
}

export default function CategoryBreakdown({
  categories,
  hiddenIds,
  isLoading,
  onToggleCategory,
  totalAmount,
}: Props) {
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null)

  if (totalAmount === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">この月の支出データがありません</p>
      </div>
    )
  }

  /**
   * 表示中カテゴリのみで円グラフを再計算する（割合は表示中の合計に対して算出）
   */
  const visibleCategories = categories.filter((cat) => !hiddenIds.has(cat.category_id))
  const visibleTotal = visibleCategories.reduce((sum, c) => sum + c.amount, 0)
  const recomputedForPie: CategorySummary[] = visibleCategories.map((cat) => ({
    ...cat,
    percentage: visibleTotal > 0 ? (cat.amount / visibleTotal) * 100 : 0,
  }))
  const slices = calculatePieSlices(recomputedForPie)

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 ${isLoading ? "opacity-50" : ""}`}>
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">カテゴリ別内訳</h2>
      </div>

      {/* 円グラフ */}
      <div className="flex justify-center p-6">
        <svg
          className="max-w-full"
          height={PIE_SIZE}
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${PIE_SIZE} ${PIE_SIZE}`}
          width={PIE_SIZE}
        >
          {slices.map((slice) => {
            const isHovered = hoveredCategoryId === slice.category.category_id
            return (
              <g
                key={slice.category.category_id}
                onMouseEnter={() => setHoveredCategoryId(slice.category.category_id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={slice.pathData}
                  fill={slice.category.category_color}
                  opacity={hoveredCategoryId === null || isHovered ? 1 : 0.4}
                  stroke="white"
                  strokeWidth={2}
                  style={{ transition: "opacity 0.2s" }}
                />
                {/* 割合が5%以上のスライスにラベルを表示 */}
                {slice.category.percentage >= 5 && (
                  <text
                    className="pointer-events-none fill-white text-[11px] font-semibold"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    x={slice.labelX}
                    y={slice.labelY}
                  >
                    {slice.category.percentage.toFixed(1)}%
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* カテゴリリスト（クリックで表示切替） */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          クリックで表示を切り替え
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {categories.map((cat) => {
            const isHovered = hoveredCategoryId === cat.category_id
            const isVisible = !hiddenIds.has(cat.category_id)
            return (
              <button
                key={cat.category_id}
                className={`flex w-full items-center justify-between py-3 text-left first:pt-0 last:pb-0 transition-colors ${
                  isHovered ? "bg-gray-50 dark:bg-gray-700/40" : ""
                } ${isVisible ? "" : "opacity-40"}`}
                onClick={() => onToggleCategory(cat.category_id)}
                onMouseEnter={() => setHoveredCategoryId(cat.category_id)}
                onMouseLeave={() => setHoveredCategoryId(null)}
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
                    {cat.percentage.toFixed(1)}%
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
