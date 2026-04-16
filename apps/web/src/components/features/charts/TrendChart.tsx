"use client"
import React, { useState } from "react"

import type { CategoryTrend, TrendResponse } from "@repo/api-schema"

type Props = {
  trendData: TrendResponse
}

/**
 * 合計線を表す特別なID（カテゴリIDとは区別するため負値を使用）
 */
const TOTAL_LINE_ID = -1

/**
 * 合計線の色
 */
const TOTAL_LINE_COLOR = "#3B82F6"

/**
 * 金額をフォーマットする
 */
const formatAmount = (amount: number) =>
  amount.toLocaleString("ja-JP", { currency: "JPY", style: "currency" })

/**
 * 金額を短縮表記にする（グラフのY軸用）
 */
const formatShortAmount = (amount: number): string => {
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}万`
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}千`
  return String(amount)
}

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
export default function TrendChart({ trendData }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set())

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

  /**
   * 凡例の表示/非表示を切り替える
   */
  const toggleLine = (id: number) => {
    setHiddenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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

  /**
   * ホバー時に表示する値のリストを作成する
   */
  const hoveredValues = hoveredIndex !== null
    ? [
      ...(isTotalVisible
        ? [{ amount: totalAmounts[hoveredIndex], color: TOTAL_LINE_COLOR, name: "合計" }]
        : []),
      ...visibleCategories.map((cat) => ({
        amount: getCategoryAmounts(cat)[hoveredIndex],
        color: cat.category_color,
        name: cat.category_name,
      })),
    ]
    : []

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

          {/* ホバー領域とX軸ラベル */}
          {trendData.months.map((m, i) => (
            <g
              key={`${m.year}-${m.month}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* ホバー時の縦線 */}
              {hoveredIndex === i && (
                <line
                  className="stroke-gray-300 dark:stroke-gray-600"
                  strokeDasharray="4 4"
                  x1={getX(i)}
                  x2={getX(i)}
                  y1={paddingTop}
                  y2={paddingTop + plotHeight}
                />
              )}

              {/* 透明なホバー領域 */}
              <rect
                fill="transparent"
                height={plotHeight}
                width={plotWidth / trendData.months.length}
                x={getX(i) - plotWidth / trendData.months.length / 2}
                y={paddingTop}
              />

              {/* 合計データポイント */}
              {isTotalVisible && (
                <circle
                  cx={getX(i)}
                  cy={getY(totalAmounts[i])}
                  fill={hoveredIndex === i ? TOTAL_LINE_COLOR : "white"}
                  r={hoveredIndex === i ? 5 : 3.5}
                  stroke={TOTAL_LINE_COLOR}
                  strokeWidth={2}
                />
              )}

              {/* X軸ラベル */}
              <text
                className="fill-gray-400 text-[10px] dark:fill-gray-500"
                dominantBaseline="hanging"
                textAnchor="middle"
                x={getX(i)}
                y={paddingTop + plotHeight + 10}
              >
                {m.month}月
              </text>
            </g>
          ))}
        </svg>

        {/* ホバー時の詳細 */}
        {hoveredIndex !== null && hoveredValues.length > 0 && (
          <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900/40">
            <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
              {trendData.months[hoveredIndex].year}年{trendData.months[hoveredIndex].month}月
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {hoveredValues.map((v) => (
                <div key={v.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: v.color }}
                    />
                    <span className="truncate text-[11px] text-gray-600 dark:text-gray-400">
                      {v.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-gray-900 dark:text-white">
                    {formatAmount(v.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
            onClick={() => toggleLine(TOTAL_LINE_ID)}
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
                onClick={() => toggleLine(cat.category_id)}
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
