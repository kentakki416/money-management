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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
        CSVアップロード
      </h1>
      <CsvUploadForm paymentSources={sourcesData.payment_sources} />
      <UploadHistory initialHistory={historyData.csv_uploads} />
    </div>
  )
}
