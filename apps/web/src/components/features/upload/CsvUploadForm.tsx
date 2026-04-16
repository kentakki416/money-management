"use client"
import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useMemo, useState } from "react"

import type { CsvUploadResponse, PaymentSource } from "@repo/api-schema"

interface CsvUploadFormProps {
  existingFileNames: string[]
  paymentSources: PaymentSource[]
}

export default function CsvUploadForm({ existingFileNames, paymentSources }: CsvUploadFormProps) {
  const router = useRouter()
  const [selectedSourceId, setSelectedSourceId] = useState<number | "">("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{
    error?: string
    success?: string
  } | null>(null)

  /**
   * アップロード済みファイル名の集合（高速な重複チェック用）
   */
  const existingFileNameSet = useMemo(
    () => new Set(existingFileNames),
    [existingFileNames]
  )

  /**
   * 選択中ファイルがすでにアップロード済みか
   */
  const isDuplicateFileName = file !== null && existingFileNameSet.has(file.name)

  const handleUpload = async () => {
    if (!file || !selectedSourceId) return

    /**
     * フロント側の重複チェック（送信前の保険）
     */
    if (existingFileNameSet.has(file.name)) {
      setResult({
        error: `同名のファイル「${file.name}」はすでにアップロード済みです`,
      })
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const source = paymentSources.find((s) => s.id === selectedSourceId)
      if (!source) return

      const formData = new FormData()
      formData.append("file", file)
      formData.append("payment_source_id", String(source.id))
      formData.append("payment_source_type", source.type)

      const res = await fetch("/api/csv-uploads", {
        body: formData,
        method: "POST",
      })

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "アップロードに失敗しました" }))
        throw new Error(errorData.error || `API error: ${res.status}`)
      }

      const data: CsvUploadResponse = await res.json()
      setResult({ success: `${data.imported_count}件の取引を登録しました` })
      setFile(null)
      router.refresh()
    } catch (error) {
      setResult({
        error:
          error instanceof Error
            ? error.message
            : "アップロードに失敗しました",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
          <Upload className="h-5 w-5 text-brand-600 dark:text-brand-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          CSVファイルをアップロード
        </h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            支払い元
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={selectedSourceId}
            onChange={(e) =>
              setSelectedSourceId(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">選択してください</option>
            {paymentSources
              .filter((s) => s.type !== "MANUAL")
              .map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.type})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            CSVファイル
          </label>
          <input
            accept=".csv"
            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-brand-50 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:bg-gray-700 dark:text-white ${
              isDuplicateFileName
                ? "border-red-400 dark:border-red-500"
                : "border-gray-300 dark:border-gray-600"
            }`}
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setResult(null)
            }}
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            同名のCSVファイルはアップロードできません。ファイル名は
            <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              smbc-transaction-期間.csv
            </code>
            のように、支払い元と期間が分かる形式を推奨します（例:
            <code className="mx-1 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              smbc-transaction-202604.csv
            </code>
            ）
          </p>
          {isDuplicateFileName && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              同名のファイル「{file?.name}」はすでにアップロード済みです。別の名前に変更してください
            </p>
          )}
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          disabled={!file || !selectedSourceId || uploading || isDuplicateFileName}
          onClick={handleUpload}
        >
          <Upload size={16} />
          {uploading ? "アップロード中..." : "アップロード"}
        </button>

        {result?.success && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
            {result.success}
          </div>
        )}
        {result?.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {result.error}
          </div>
        )}
      </div>
    </div>
  )
}
