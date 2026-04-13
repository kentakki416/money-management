import { Response } from "express"

import { ErrorResponse, updateTransactionRequestSchema, updateTransactionResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { TransactionRepository, UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 取引更新API
 */
export class TransactionUpdateController {
  constructor(
    private transactionRepository: TransactionRepository,
    private userCategoryRuleRepository: UserCategoryRuleRepository
  ) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!
      const id = parseInt(req.params.id, 10)

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = { error: "Invalid transaction ID", status_code: 400 }
        return res.status(400).json(errorResponse)
      }

      const data = updateTransactionRequestSchema.parse(req.body)

      const existing = await this.transactionRepository.findByFilter({ userId })
      const existingTransaction = existing.find((t) => t.id === id)

      if (!existingTransaction) {
        const errorResponse: ErrorResponse = { error: "Transaction not found", status_code: 404 }
        return res.status(404).json(errorResponse)
      }

      const transaction = await service.transaction.updateTransaction(
        id,
        {
          amount: data.amount,
          categoryId: data.category_id,
          description: data.description,
          transactionDate: data.transaction_date ? new Date(data.transaction_date) : undefined,
        },
        existingTransaction.categoryId,
        existingTransaction.description,
        userId,
        this.transactionRepository,
        this.userCategoryRuleRepository
      )

      const response = updateTransactionResponseSchema.parse({
        transaction: {
          amount: transaction.amount,
          category_color: transaction.categoryColor,
          category_id: transaction.categoryId,
          category_name: transaction.categoryName,
          created_at: transaction.createdAt.toISOString(),
          csv_upload_id: transaction.csvUploadId,
          description: transaction.description,
          id: transaction.id,
          is_manual: transaction.isManual,
          payment_source_id: transaction.paymentSourceId,
          payment_source_name: transaction.paymentSourceName,
          transaction_date: transaction.transactionDate.toISOString().split("T")[0],
          updated_at: transaction.updatedAt.toISOString(),
          user_id: transaction.userId,
        },
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "TransactionUpdateController: Failed to update transaction",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to update transaction",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
