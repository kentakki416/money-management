import type { Metadata } from "next"

import type { GetAdminUserListResponse } from "@repo/api-schema"

import UserTable from "@/components/features/user/UserTable"
import PageBreadcrumb from "@/components/layout/PageBreadCrumb"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "登録ユーザーの管理",
  title: "ユーザー管理 | Admin",
}

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const data = await apiClient.get<GetAdminUserListResponse>(
    "/api/admin/users"
  )

  return (
    <div>
      <PageBreadcrumb pageTitle="ユーザー管理" />

      <UserTable users={data.users} />
    </div>
  )
}
