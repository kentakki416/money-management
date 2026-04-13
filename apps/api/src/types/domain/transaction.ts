export type ParsedTransaction = {
  amount: number
  description: string
  transactionDate: Date
}

export type Transaction = {
  id: number
  amount: number
  categoryColor: string | null
  categoryId: number | null
  categoryName: string | null
  csvUploadId: number | null
  description: string
  isManual: boolean
  paymentSourceId: number
  paymentSourceName: string
  transactionDate: Date
  userId: number
  createdAt: Date
  updatedAt: Date
}
