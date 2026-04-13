export type CsvUpload = {
  id: number
  fileHash: string
  fileName: string
  paymentSourceId: number
  paymentSourceName: string
  rowCount: number
  uploadedAt: Date
  userId: number
}
