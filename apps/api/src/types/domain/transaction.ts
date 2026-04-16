export type ParsedTransaction = {
  amount: number
  description: string
  transactionDate: Date
}

/**
 * 取引の出所情報（CSV 由来の取引のみ設定される）
 * 手動追加の場合は null
 */
export type TransactionCsvUploadInfo = {
  id: number
  fileName: string
  uploadedAt: Date
}

export type Transaction = {
  id: number
  amount: number
  categoryColor: string | null
  categoryId: number | null
  categoryName: string | null
  csvUpload: TransactionCsvUploadInfo | null
  csvUploadId: number | null
  description: string
  isManual: boolean
  paymentSourceColor: string
  paymentSourceId: number
  paymentSourceName: string
  transactionDate: Date
  userId: number
  createdAt: Date
  updatedAt: Date
}
