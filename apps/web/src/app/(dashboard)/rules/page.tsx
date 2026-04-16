import type { Metadata } from "next"

import type {
  GetCategoryListResponse,
  GetUserCategoryRuleListResponse,
} from "@repo/api-schema"

import RulesPageContent from "@/components/features/rules/RulesPageContent"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "自分専用の分類ルールを管理",
  title: "分類ルール | Money Manager",
}

export const dynamic = "force-dynamic"

export default async function RulesPage() {
  const [rulesData, categoriesData] = await Promise.all([
    apiClient.get<GetUserCategoryRuleListResponse>("/api/user-category-rules"),
    apiClient.get<GetCategoryListResponse>("/api/categories"),
  ])

  return (
    <div className="space-y-6">
      <RulesPageContent
        categories={categoriesData.categories}
        initialRules={rulesData.rules}
      />
    </div>
  )
}
