import type { Metadata } from "next"
import React from "react"

import type { AdminStatsResponse } from "@repo/api-schema"

import { DashboardMetrics } from "@/components/features/dashboard/DashboardMetrics"
import DemographicCard from "@/components/features/dashboard/DemographicCard"
import MonthlyTarget from "@/components/features/dashboard/MonthlyTarget"
import RecentOrders from "@/components/features/dashboard/RecentOrders"
import StatisticsChart from "@/components/features/dashboard/StatisticsChart"
import UserRegistrationChart from "@/components/features/dashboard/UserRegistrationChart"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "管理画面ダッシュボード",
  title: "ダッシュボード | Admin",
}

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const stats = await apiClient.get<AdminStatsResponse>("/api/admin/stats")

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <DashboardMetrics csvUploads={stats.total_csv_uploads} users={stats.total_users} />

        <UserRegistrationChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>

      <div className="col-span-12">
        <StatisticsChart />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  )
}
