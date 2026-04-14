"use client"
import { ApexOptions } from "apexcharts"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import type { AdminStatsResponse, RegistrationPeriod } from "@repo/api-schema"

const ReactApexChart = dynamic(async () => import("react-apexcharts"), {
  ssr: false,
})

const TABS: { label: string; value: RegistrationPeriod }[] = [
  { label: "1年", value: "yearly" },
  { label: "1ヶ月", value: "monthly" },
  { label: "7日", value: "weekly" },
  { label: "24時間", value: "daily" },
]

interface ChartData {
  categories: string[]
  data: number[]
}

export default function UserRegistrationChart() {
  const [selected, setSelected] = useState<RegistrationPeriod>("yearly")
  const [chartData, setChartData] = useState<ChartData>({ categories: [], data: [] })

  useEffect(() => {
    let cancelled = false
    const loadStats = async () => {
      const res = await fetch(`/api/admin/stats?period=${selected}`)
      const stats: AdminStatsResponse = await res.json()
      if (!cancelled) {
        setChartData({
          categories: stats.registrations.map((r) => r.label),
          data: stats.registrations.map((r) => r.count),
        })
      }
    }
    loadStats()
    return () => { cancelled = true }
  }, [selected])

  const handleTabChange = (period: RegistrationPeriod) => {
    setSelected(period)
  }

  const options: ApexOptions = {
    colors: ["#465fff"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 180,
      toolbar: {
        show: false,
      },
      type: "bar",
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      fontFamily: "Outfit",
      horizontalAlign: "left",
      position: "top",
      show: true,
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        borderRadiusApplication: "end",
        columnWidth: "39%",
        horizontal: false,
      },
    },
    stroke: {
      colors: ["transparent"],
      show: true,
      width: 4,
    },
    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      categories: chartData.categories,
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
  }

  const series = [
    {
      data: chartData.data,
      name: "登録数",
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          ユーザー登録推移
        </h3>

        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={`rounded-md px-3 py-2 text-theme-sm font-medium ${
                selected === tab.value
                  ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={() => handleTabChange(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={180}
          />
        </div>
      </div>
    </div>
  )
}
