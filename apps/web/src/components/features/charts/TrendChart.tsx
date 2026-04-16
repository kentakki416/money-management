"use client"
import React, { useState } from "react"

import type { TrendResponse } from "@repo/api-schema"

type Props = {
  trendData: TrendResponse
}

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
 * SVGベースの月次推移チャート
 */
export default function TrendChart({ trendData }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (trendData.months.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">推移データがありません</p>
      </div>
    )
  }

  const totalAmounts = trendData.total.map((t) => t.amount)
  const maxAmount = Math.max(...totalAmounts, 1)

  /**
   * チャートの寸法設定
   */
  const chartWidth = 800
  const chartHeight = 300
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
  const linePath = totalAmounts
    .map((amount, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(amount)}`)
    .join(" ")

  /**
   * エリア塗りつぶしのパスを生成する
   */
  const areaPath = `${linePath} L ${getX(totalAmounts.length - 1)} ${paddingTop + plotHeight} L ${getX(0)} ${paddingTop + plotHeight} Z`

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white">月次推移（過去12ヶ月）</h2>
      </div>

      <div className="p-4">
        <svg
          className="w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
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

          {/* エリア塗りつぶし */}
          <path
            className="fill-brand-500/10 dark:fill-brand-400/10"
            d={areaPath}
          />

          {/* 折れ線 */}
          <path
            className="stroke-brand-500 dark:stroke-brand-400"
            d={linePath}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
          />

          {/* データポイントとラベル */}
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

              {/* データポイント */}
              <circle
                className={`${hoveredIndex === i ? "fill-brand-500 dark:fill-brand-400" : "fill-white dark:fill-gray-800"} stroke-brand-500 dark:stroke-brand-400`}
                cx={getX(i)}
                cy={getY(totalAmounts[i])}
                r={hoveredIndex === i ? 5 : 3.5}
                strokeWidth={2}
              />

              {/* ホバー時の金額ラベル */}
              {hoveredIndex === i && (
                <text
                  className="fill-gray-900 text-[11px] font-semibold dark:fill-white"
                  textAnchor="middle"
                  x={getX(i)}
                  y={getY(totalAmounts[i]) - 12}
                >
                  {formatAmount(totalAmounts[i])}
                </text>
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
      </div>

      {/* カテゴリ別凡例 */}
      {trendData.categories.length > 0 && (
        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            {trendData.categories.map((cat) => (
              <div key={cat.category_id} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: cat.category_color }}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {cat.category_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
