import type { Metadata } from "next"

import type {
  GetCategoryListResponse,
  GetCategoryRuleListResponse,
} from "@repo/api-schema"

import CategoryRuleTable from "@/components/features/category-rule/CategoryRuleTable"
import PageBreadcrumb from "@/components/layout/PageBreadCrumb"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "自動分類ルールの管理",
  title: "分類ルール管理 | Admin",
}

export const dynamic = "force-dynamic"

export default async function CategoryRulesPage() {
  const [rulesData, categoriesData] = await Promise.all([
    apiClient.get<GetCategoryRuleListResponse>("/api/admin/category-rules"),
    apiClient.get<GetCategoryListResponse>("/api/admin/categories"),
  ])

  return (
    <div>
      <PageBreadcrumb pageTitle="分類ルール管理" />

      <CategoryRuleTable
        categories={categoriesData.categories}
        rules={rulesData.rules}
      />
    </div>
  )
}
