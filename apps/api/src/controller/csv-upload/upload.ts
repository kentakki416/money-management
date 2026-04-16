import { Response } from "express"

import { csvUploadRequestSchema, csvUploadResponseSchema, ErrorResponse } from "@repo/api-schema"

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
    const userId = req.userId!

    if (!req.file) {
      const errorResponse: ErrorResponse = { error: "No file uploaded", status_code: 400 }
      return res.status(400).json(errorResponse)
    }

    const body = csvUploadRequestSchema.parse(req.body)

    const result = await service.csvUpload.uploadCsv(
      {
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        paymentSourceId: body.payment_source_id,
        paymentSourceType: body.payment_source_type,
        userId,
      },
      this.transactionRepository,
      this.csvUploadRepository,
      this.categoryRuleRepository,
      this.userCategoryRuleRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = csvUploadResponseSchema.parse({
      csv_upload: {
        file_hash: result.value.csvUpload.fileHash,
        file_name: result.value.csvUpload.fileName,
        id: result.value.csvUpload.id,
        payment_source_id: result.value.csvUpload.paymentSourceId,
        payment_source_name: result.value.csvUpload.paymentSourceName,
        row_count: result.value.csvUpload.rowCount,
        uploaded_at: result.value.csvUpload.uploadedAt.toISOString(),
        user_id: result.value.csvUpload.userId,
      },
      imported_count: result.value.importedCount,
    })
    return res.status(201).json(response)
  }
}
