import { Response } from "express"

import { deleteTransactionPathParamSchema, deleteTransactionResponseSchema, ErrorResponse } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { TransactionRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 取引削除API
 */
export class TransactionDeleteController {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const { id } = deleteTransactionPathParamSchema.parse(req.params)

    const result = await service.transaction.deleteTransaction(id, { transactionRepository: this.transactionRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = deleteTransactionResponseSchema.parse({ success: true })
    return res.status(200).json(response)
  }
}
