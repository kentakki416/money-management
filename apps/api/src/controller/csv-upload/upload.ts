import { Response } from "express"

import { csvUploadResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import {
  CategoryRuleRepository,
  CsvUploadRepository,
  PaymentSourceRepository,
  TransactionRepository,
  UserCategoryRuleRepository,
} from "../../repository/mysql"
import * as service from "../../service"

/**
 * multerのファイルフィールドを含むリクエスト
 */
interface CsvUploadRequest extends AuthRequest {
  file?: Express.Multer.File
}

/**
 * CSVアップロードAPI
 */
export class CsvUploadController {
  constructor(
    private transactionRepository: TransactionRepository,
    private csvUploadRepository: CsvUploadRepository,
    private paymentSourceRepository: PaymentSourceRepository,
    private categoryRuleRepository: CategoryRuleRepository,
    private userCategoryRuleRepository: UserCategoryRuleRepository
  ) {}

  async execute(req: CsvUploadRequest, res: Response) {
    try {
      const userId = req.userId!

      if (!req.file) {
        const errorResponse: ErrorResponse = { error: "No file uploaded", status_code: 400 }
        return res.status(400).json(errorResponse)
      }

      const paymentSourceId = parseInt(req.body.payment_source_id, 10)
      const paymentSourceType = req.body.payment_source_type

      if (isNaN(paymentSourceId)) {
        const errorResponse: ErrorResponse = { error: "Invalid payment_source_id", status_code: 400 }
        return res.status(400).json(errorResponse)
      }

      if (!paymentSourceType) {
        const errorResponse: ErrorResponse = { error: "payment_source_type is required", status_code: 400 }
        return res.status(400).json(errorResponse)
      }

      const { csvUpload, importedCount } = await service.csvUpload.uploadCsv(
        {
          fileBuffer: req.file.buffer,
          fileName: req.file.originalname,
          paymentSourceId,
          paymentSourceType,
          userId,
        },
        this.transactionRepository,
        this.csvUploadRepository,
        this.categoryRuleRepository,
        this.userCategoryRuleRepository
      )

      const response = csvUploadResponseSchema.parse({
        csv_upload: {
          file_hash: csvUpload.fileHash,
          file_name: csvUpload.fileName,
          id: csvUpload.id,
          payment_source_id: csvUpload.paymentSourceId,
          payment_source_name: csvUpload.paymentSourceName,
          row_count: csvUpload.rowCount,
          uploaded_at: csvUpload.uploadedAt.toISOString(),
          user_id: csvUpload.userId,
        },
        imported_count: importedCount,
      })

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "CsvUploadController: Failed to upload CSV",
        error instanceof Error ? error : new Error("Unknown error")
      )

      const isDuplicate =
        error instanceof Error && error.message.includes("すでにアップロード済み")

      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to upload CSV",
        status_code: isDuplicate ? 409 : 400,
      }
      res.status(isDuplicate ? 409 : 400).json(errorResponse)
    }
  }
}
