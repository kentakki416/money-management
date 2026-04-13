import { Response } from "express"

import { deleteTransactionResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { TransactionRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 取引削除API
 */
export class TransactionDeleteController {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10)

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = { error: "Invalid transaction ID", status_code: 400 }
        return res.status(400).json(errorResponse)
      }

      await service.transaction.deleteTransaction(id, this.transactionRepository)

      const response = deleteTransactionResponseSchema.parse({ success: true })
      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "TransactionDeleteController: Failed to delete transaction",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to delete transaction",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
