"use client"
import React, { useState } from "react"

import type { CategoryTrend, TrendResponse } from "@repo/api-schema"

type Props = {
  hiddenIds: Set<number>
  onToggleLine: (id: number) => void
  trendData: TrendResponse
}

/**
 * 合計線を表す特別なID（カテゴリIDとは区別するため負値を使用）
 */
export const TOTAL_LINE_ID = -1

/**
 * 合計線の色
 */
export const TOTAL_LINE_COLOR = "#3B82F6"

/**
 * 金額を短縮表記にする（グラフのY軸用）
 */
const formatShortAmount = (amount: number): string => {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}千`
  return String(amount)
}

/**
 * 金額をフォーマットする（ツールチップ用）
 */
const formatAmount = (amount: number): string =>
  `¥${amount.toLocaleString()}`

/**
 * カテゴリごとの月次データを年月キーでマップ化する
 */
const buildCategoryAmountMap = (category: CategoryTrend): Map<string, number> => {
  const map = new Map<string, number>()
  category.data.forEach((point) => {
    map.set(`${point.year}-${point.month}`, point.amount)
  })
  return map
}

/**
 * SVGベースの月次推移チャート（合計 + カテゴリ別）
 */
/**
 * ホバー中のデータポイントを特定する型
 */
type HoveredPoint = {
  lineId: number
  monthIndex: number
}

export default function TrendChart({ hiddenIds, onToggleLine, trendData }: Props) {
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null)

  if (trendData.months.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">推移データがありません</p>
      </div>
    )
  }

  const isTotalVisible = !hiddenIds.has(TOTAL_LINE_ID)
  const visibleCategories = trendData.categories.filter(
    (cat) => !hiddenIds.has(cat.category_id)
  )

  const totalAmounts = trendData.total.map((t) => t.amount)

  /**
   * 表示中のラインから最大値を計算する
   */
  const visibleAmounts: number[] = []
  if (isTotalVisible) {
    visibleAmounts.push(...totalAmounts)
  }
  visibleCategories.forEach((cat) => {
    const amountMap = buildCategoryAmountMap(cat)
    trendData.months.forEach((m) => {
      visibleAmounts.push(amountMap.get(`${m.year}-${m.month}`) ?? 0)
    })
  })
  const maxAmount = Math.max(...visibleAmounts, 1)

  /**
   * チャートの寸法設定
   */
  const chartWidth = 800
  const chartHeight = 320
  const paddingLeft = 60
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 40
  const plotWidth = chartWidth - paddingLeft - paddingRight
  const plotHeight = chartHeight - paddingTop - paddingBottom

  /**
   * Y軸のグリッド線を生成する
   */
  const yAxisSteps = 5
  const yAxisValues = Array.from({ length: yAxisSteps + 1 }, (_, i) =>
    Math.round((maxAmount / yAxisSteps) * (yAxisSteps - i))
  )

  /**
   * データポイントの座標を計算する
   */
  const getX = (index: number) =>
    paddingLeft + (plotWidth / (trendData.months.length - 1 || 1)) * index

  const getY = (amount: number) =>
    paddingTop + plotHeight - (amount / maxAmount) * plotHeight

  /**
   * 折れ線のパスを生成する
   */
  const buildLinePath = (amounts: number[]): string =>
    amounts
      .map((amount, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(amount)}`)
      .join(" ")

  /**
   * カテゴリごとの月次データ配列を取得する
   */
  const getCategoryAmounts = (category: CategoryTrend): number[] => {
    const amountMap = buildCategoryAmountMap(category)
    return trendData.months.map((m) => amountMap.get(`${m.year}-${m.month}`) ?? 0)
  }

  const totalLinePath = buildLinePath(totalAmounts)
  const totalAreaPath = `${totalLinePath} L ${getX(totalAmounts.length - 1)} ${paddingTop + plotHeight} L ${getX(0)} ${paddingTop + plotHeight} Z`

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">月次推移（過去12ヶ月）</h2>
      </div>

      <div className="p-4">
        <svg
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        >
          {/* Y軸グリッド線 */}
          {yAxisValues.map((value, i) => (
            <g key={i}>
              <line
                className="stroke-gray-200 dark:stroke-gray-700"
                strokeDasharray="4 4"
                x1={paddingLeft}
                x2={chartWidth - paddingRight}
                y1={getY(value)}
                y2={getY(value)}
              />
              <text
                className="fill-gray-400 text-[10px] dark:fill-gray-500"
                dominantBaseline="middle"
                textAnchor="end"
                x={paddingLeft - 8}
                y={getY(value)}
              >
                {formatShortAmount(value)}
              </text>
            </g>
          ))}

          {/* 合計のエリア塗りつぶし */}
          {isTotalVisible && (
            <path
              d={totalAreaPath}
              fill={TOTAL_LINE_COLOR}
              opacity={0.08}
            />
          )}

          {/* カテゴリ別の折れ線 */}
          {visibleCategories.map((cat) => {
            const amounts = getCategoryAmounts(cat)
            return (
              <path
                key={cat.category_id}
                d={buildLinePath(amounts)}
                fill="none"
                opacity={0.85}
                stroke={cat.category_color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
              />
            )
          })}

          {/* 合計の折れ線（太め・最前面） */}
          {isTotalVisible && (
            <path
              d={totalLinePath}
              fill="none"
              stroke={TOTAL_LINE_COLOR}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.75}
            />
          )}

          {/* X軸ラベル */}
          {trendData.months.map((m, i) => (
            <text
              key={`${m.year}-${m.month}`}
              className="fill-gray-400 text-[10px] dark:fill-gray-500"
              dominantBaseline="hanging"
              textAnchor="middle"
              x={getX(i)}
              y={paddingTop + plotHeight + 10}
            >
              {m.month}月
            </text>
          ))}

          {/* 合計データポイント（個別ホバー） */}
          {isTotalVisible && trendData.months.map((_, i) => {
            const isHovered = hoveredPoint?.lineId === TOTAL_LINE_ID && hoveredPoint.monthIndex === i
            const cx = getX(i)
            const cy = getY(totalAmounts[i])
            return (
              <g
                key={`total-${i}`}
                onMouseEnter={() => setHoveredPoint({ lineId: TOTAL_LINE_ID, monthIndex: i })}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* 透明な大きめのホバー領域 */}
                <circle cx={cx} cy={cy} fill="transparent" r={12} />
                <circle
                  cx={cx}
                  cy={cy}
                  fill={isHovered ? TOTAL_LINE_COLOR : "white"}
                  r={isHovered ? 5 : 3.5}
                  stroke={TOTAL_LINE_COLOR}
                  strokeWidth={2}
                />
                {isHovered && (
                  <text
                    className="text-[11px] font-bold"
                    dominantBaseline="auto"
                    fill={TOTAL_LINE_COLOR}
                    textAnchor="middle"
                    x={cx}
                    y={cy - 10}
                  >
                    {formatAmount(totalAmounts[i])}
                  </text>
                )}
              </g>
            )
          })}

          {/* カテゴリ別データポイント（個別ホバー） */}
          {visibleCategories.map((cat) => {
            const amounts = getCategoryAmounts(cat)
            return trendData.months.map((_, i) => {
              const isHovered = hoveredPoint?.lineId === cat.category_id && hoveredPoint.monthIndex === i
              const cx = getX(i)
              const cy = getY(amounts[i])
              return (
                <g
                  key={`cat-${cat.category_id}-${i}`}
                  onMouseEnter={() => setHoveredPoint({ lineId: cat.category_id, monthIndex: i })}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {/* 透明な大きめのホバー領域 */}
                  <circle cx={cx} cy={cy} fill="transparent" r={12} />
                  <circle
                    cx={cx}
                    cy={cy}
                    fill={isHovered ? cat.category_color : "white"}
                    r={isHovered ? 4.5 : 3}
                    stroke={cat.category_color}
                    strokeWidth={1.75}
                  />
                  {isHovered && (
                    <text
                      className="text-[11px] font-semibold"
                      dominantBaseline="auto"
                      fill={cat.category_color}
                      textAnchor="middle"
                      x={cx}
                      y={cy - 8}
                    >
                      {formatAmount(amounts[i])}
                    </text>
                  )}
                </g>
              )
            })
          })}
        </svg>

      </div>

      {/* インタラクティブな凡例（クリックで表示切替） */}
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
          クリックで表示を切り替え
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 合計 */}
          <button
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
              isTotalVisible
                ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                : "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
            }`}
            onClick={() => onToggleLine(TOTAL_LINE_ID)}
          >
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: isTotalVisible ? TOTAL_LINE_COLOR : "transparent",
                border: `2px solid ${TOTAL_LINE_COLOR}`,
              }}
            />
            <span>合計</span>
          </button>

          {/* カテゴリ別 */}
          {trendData.categories.map((cat) => {
            const isVisible = !hiddenIds.has(cat.category_id)
            return (
              <button
                key={cat.category_id}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                  isVisible
                    ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    : "border-gray-100 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                }`}
                onClick={() => onToggleLine(cat.category_id)}
              >
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: isVisible ? cat.category_color : "transparent",
                    border: `2px solid ${cat.category_color}`,
                  }}
                />
                <span>{cat.category_name}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
