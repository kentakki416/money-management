import { Response } from "express"

import { deleteCsvUploadPathParamSchema, deleteCsvUploadResponseSchema, ErrorResponse } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { CsvUploadRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * CSVアップロード削除API（関連取引も一緒に削除）
 */
export class CsvUploadDeleteController {
  constructor(private csvUploadRepository: CsvUploadRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const { id } = deleteCsvUploadPathParamSchema.parse(req.params)

    const result = await service.csvUpload.deleteCsvUpload(id, userId, { csvUploadRepository: this.csvUploadRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = deleteCsvUploadResponseSchema.parse({
      deleted_transaction_count: result.value.deletedTransactionCount,
      success: true,
    })
    return res.status(200).json(response)
  }
}
