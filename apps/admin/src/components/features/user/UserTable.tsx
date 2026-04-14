"use client"

import Image from "next/image"
import { useState } from "react"

import type {
  AdminUser,
  GetAdminUserDetailResponse,
} from "@repo/api-schema"

import Alert from "@/components/ui/alert/Alert"
import Badge from "@/components/ui/badge/Badge"
import { Modal } from "@/components/ui/modal"
import { type Column, DataTable } from "@/components/ui/table"

interface UserTableProps {
  users: AdminUser[]
}

export default function UserTable({ users }: UserTableProps) {
  const [detailUser, setDetailUser] =
    useState<GetAdminUserDetailResponse["user"] | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShowDetail = async (userId: number) => {
    setIsDetailLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data: GetAdminUserDetailResponse = await res.json()
      setDetailUser(data.user)
    } catch (e) {
      setError(e instanceof Error ? e.message : "詳細の取得に失敗しました")
    } finally {
      setIsDetailLoading(false)
    }
  }

  const columns: Column<AdminUser>[] = [
    { header: "ID", key: "id" },
    {
      header: "ユーザー",
      render: (user) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-white/90">
            {user.name ?? "-"}
          </div>
          <div className="text-theme-xs text-gray-500">
            {user.email ?? "-"}
          </div>
        </div>
      ),
    },
    {
      header: "取引数",
      render: (user) => user.transaction_count.toLocaleString(),
    },
    { header: "CSV取込数", key: "csv_upload_count" },
    {
      header: "登録日",
      render: (user) =>
        new Date(user.created_at).toLocaleDateString("ja-JP"),
    },
    {
      header: "Actions",
      render: (user) => (
        <button
          className="text-gray-500 hover:text-gray-800 dark:hover:text-white/90"
          onClick={async () => handleShowDetail(user.id)}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ),
    },
  ]

  return (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          ユーザー一覧
        </h2>
      </div>

      {error && (
        <div className="mb-4">
          <Alert message={error} title="エラー" variant="error" />
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        getRowKey={(user) => user.id}
        pagination={{ pageSizeOptions: [5, 10, 20] }}
        search={{
          filterKeys: ["name", "email"],
          placeholder: "名前・メールで検索...",
        }}
      />

      {/* 詳細モーダル */}
      <Modal
        isOpen={!!detailUser || isDetailLoading}
        onClose={() => setDetailUser(null)}
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            ユーザー詳細
          </h3>

          {isDetailLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="text-sm text-gray-500">読み込み中...</span>
            </div>
          ) : detailUser ? (
            <div className="space-y-5">
              {/* アバター + 基本情報 */}
              <div className="flex items-center gap-4">
                {detailUser.avatar_url ? (
                  <Image
                    alt={detailUser.name ?? "User"}
                    className="h-14 w-14 rounded-full object-cover"
                    height={56}
                    src={detailUser.avatar_url}
                    width={56}
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {(detailUser.name ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-800 dark:text-white/90">
                    {detailUser.name ?? "-"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {detailUser.email ?? "-"}
                  </div>
                </div>
              </div>

              {/* 統計カード */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    取引数
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                    {detailUser.transaction_count.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    CSV取込数
                  </div>
                  <div className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                    {detailUser.csv_upload_count}
                  </div>
                </div>
              </div>

              {/* 登録日 */}
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  登録日
                </div>
                <div className="mt-1 text-sm text-gray-800 dark:text-white/90">
                  {new Date(detailUser.created_at).toLocaleDateString("ja-JP")}
                </div>
              </div>

              {/* 支払い元一覧 */}
              {detailUser.payment_sources.length > 0 && (
                <div>
                  <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                    支払い元
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detailUser.payment_sources.map((ps) => (
                      <Badge key={ps.id} color="primary" variant="light">
                        {ps.name} ({ps.type})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </Modal>
    </>
  )
}
