import { Response } from "express"

import { ErrorResponse, getCsvUploadListResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { CsvUploadRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * CSVアップロード履歴一覧取得API
 */
export class CsvUploadListController {
  constructor(private csvUploadRepository: CsvUploadRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const result = await service.csvUpload.getUploadHistory(userId, this.csvUploadRepository)

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getCsvUploadListResponseSchema.parse({
      csv_uploads: result.value.map((u) => ({
        file_hash: u.fileHash,
        file_name: u.fileName,
        id: u.id,
        payment_source_id: u.paymentSourceId,
        payment_source_name: u.paymentSourceName,
        row_count: u.rowCount,
        uploaded_at: u.uploadedAt.toISOString(),
        user_id: u.userId,
      })),
    })
    return res.status(200).json(response)
  }
}
