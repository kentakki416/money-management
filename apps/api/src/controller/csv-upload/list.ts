import { Response } from "express"

import { ErrorResponse, getCsvUploadListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { CsvUploadRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * CSVアップロード履歴一覧取得API
 */
export class CsvUploadListController {
  constructor(private csvUploadRepository: CsvUploadRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const uploads = await service.csvUpload.getUploadHistory(userId, this.csvUploadRepository)

      const response = getCsvUploadListResponseSchema.parse({
        csv_uploads: uploads.map((u) => ({
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

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "CsvUploadListController: Failed to get upload history",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get upload history",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
