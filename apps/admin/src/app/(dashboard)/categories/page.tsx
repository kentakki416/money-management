import type { Metadata } from "next"

import type { GetCategoryListResponse } from "@repo/api-schema"

import CategoryTable from "@/components/features/category/CategoryTable"
import PageBreadcrumb from "@/components/layout/PageBreadCrumb"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "カテゴリマスターの管理",
  title: "カテゴリ管理 | Admin",
}

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const data = await apiClient.get<GetCategoryListResponse>(
    "/api/admin/categories"
  )

  return (
    <div>
      <PageBreadcrumb pageTitle="カテゴリ管理" />

      <CategoryTable categories={data.categories} />
    </div>
  )
}
