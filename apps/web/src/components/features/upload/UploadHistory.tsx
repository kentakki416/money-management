"use client"
import { History, Trash2, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import type { CsvUpload } from "@repo/api-schema"

import { deleteCsvUpload } from "@/app/(dashboard)/upload/actions"
import { DataTable, type Column } from "@/components/ui/table"
import { useToast } from "@/features/toast/toast.context"

interface UploadHistoryProps {
  initialHistory: CsvUpload[]
}

/**
 * DataTable用の行データ型（検索用にフラットなフィールドを持つ）
 */
type UploadRow = CsvUpload & {
  formatted_date: string
}

export default function UploadHistory({ initialHistory }: UploadHistoryProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [deletingUpload, setDeletingUpload] = useState<CsvUpload | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    if (!deletingUpload) return
    setIsSubmitting(true)
    try {
      const res = await deleteCsvUpload(deletingUpload.id)
      showToast(
        `CSV「${deletingUpload.file_name}」と関連する${res.deleted_transaction_count}件の取引を削除しました`,
        "success"
      )
      setDeletingUpload(null)
      router.refresh()
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "削除に失敗しました",
        "error"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const rows: UploadRow[] = useMemo(() =>
    initialHistory.map((upload) => ({
      ...upload,
      formatted_date: new Date(upload.uploaded_at).toLocaleString("ja-JP"),
    })),
  [initialHistory])

  const columns: Column<UploadRow>[] = useMemo(() => [
    {
      header: "ファイル名",
      key: "file_name",
      className: "px-5 py-4 text-sm font-medium text-gray-900 dark:text-white",
    },
    {
      header: "支払い元",
      key: "payment_source_name",
      className: "px-5 py-4 text-sm text-gray-600 dark:text-gray-300",
    },
    {
      header: "取込件数",
      render: (row) => (
        <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          {row.row_count}件
        </span>
      ),
    },
    {
      header: "アップロード日時",
      key: "formatted_date",
    },
    {
      className: "px-5 py-4 text-right",
      header: "操作",
      render: (row) => (
        <div className="flex justify-end">
          <button
            aria-label="削除"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            onClick={() => setDeletingUpload(row)}
            title="このCSVと関連する取引を削除"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [])

  return (
    <>
      <div>
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <History className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            アップロード履歴
          </h2>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="アップロード履歴がありません"
          getRowKey={(row) => row.id}
          pagination={{ pageSizeOptions: [5, 10, 20] }}
          search={{
            filterKeys: ["file_name", "payment_source_name"],
            placeholder: "ファイル名・支払い元で検索...",
          }}
        />
      </div>

      {/* 削除確認モーダル */}
      {deletingUpload && (
        <DeleteConfirmModal
          isSubmitting={isSubmitting}
          upload={deletingUpload}
          onCancel={() => setDeletingUpload(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  )
}

/**
 * CSV削除確認モーダル
 * 削除すると関連する取引も一緒に削除される旨を警告する
 */
function DeleteConfirmModal({
  isSubmitting,
  upload,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean
  upload: CsvUpload
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              CSVファイルを削除
            </h2>
            <button
              aria-label="閉じる"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              onClick={onCancel}
            >
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3 px-5 py-5">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              この操作は取り消せません。関連する取引データも同時に削除されます。
            </div>
            <div className="space-y-1 text-sm text-gray-700 dark:text-gray-200">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 dark:text-gray-400">ファイル名:</span>
                <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                  {upload.file_name}
                </code>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 dark:text-gray-400">取込件数:</span>
                <span>{upload.row_count}件の取引</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              キャンセル
            </button>
            <button
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting ? "削除中..." : "削除する"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
