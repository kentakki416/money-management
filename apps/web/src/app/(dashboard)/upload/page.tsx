import type { Metadata } from "next"

import type { GetCsvUploadListResponse, GetPaymentSourceListResponse } from "@repo/api-schema"

import CsvUploadForm from "@/components/features/upload/CsvUploadForm"
import UploadHistory from "@/components/features/upload/UploadHistory"
import { apiClient } from "@/libs/api-client"

export const metadata: Metadata = {
  description: "CSVファイルをアップロードして取引を登録",
  title: "CSVアップロード | Money Manager",
}

export const dynamic = "force-dynamic"

export default async function UploadPage() {
  const [sourcesData, historyData] = await Promise.all([
    apiClient.get<GetPaymentSourceListResponse>("/api/payment-sources"),
    apiClient.get<GetCsvUploadListResponse>("/api/csv-uploads"),
  ])

  const existingFileNames = historyData.csv_uploads.map((u) => u.file_name)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800 dark:text-white">
        CSVアップロード
      </h1>
      <CsvUploadForm
        existingFileNames={existingFileNames}
        paymentSources={sourcesData.payment_sources}
      />
      <UploadHistory initialHistory={historyData.csv_uploads} />
    </div>
  )
}
