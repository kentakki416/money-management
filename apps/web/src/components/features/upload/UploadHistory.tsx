"use client"
import { History } from "lucide-react"

import type { CsvUpload } from "@repo/api-schema"

interface UploadHistoryProps {
  initialHistory: CsvUpload[]
}

export default function UploadHistory({ initialHistory }: UploadHistoryProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
          <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          アップロード履歴
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                ファイル名
              </th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                支払い元
              </th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                取込件数
              </th>
              <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                アップロード日時
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {initialHistory.map((upload) => (
              <tr
                key={upload.id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {upload.file_name}
                </td>
                <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {upload.payment_source_name}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
                    {upload.row_count}件
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {new Date(upload.uploaded_at).toLocaleString("ja-JP")}
                </td>
              </tr>
            ))}
            {initialHistory.length === 0 && (
              <tr>
                <td
                  className="px-6 py-12 text-center text-gray-400"
                  colSpan={4}
                >
                  アップロード履歴がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
