import { Response } from "express"

import { createTransactionRequestSchema, createTransactionResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { CategoryRuleRepository, TransactionRepository, UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 取引手動作成API
 */
export class TransactionCreateController {
  constructor(
    private transactionRepository: TransactionRepository,
    private categoryRuleRepository: CategoryRuleRepository,
    private userCategoryRuleRepository: UserCategoryRuleRepository
  ) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const data = createTransactionRequestSchema.parse(req.body)

      const transaction = await service.transaction.createManualTransaction(
        {
          amount: data.amount,
          categoryId: data.category_id,
          description: data.description,
          paymentSourceId: data.payment_source_id,
          transactionDate: new Date(data.transaction_date),
          userId,
        },
        this.transactionRepository,
        this.categoryRuleRepository,
        this.userCategoryRuleRepository
      )

      const response = createTransactionResponseSchema.parse({
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

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "TransactionCreateController: Failed to create transaction",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to create transaction",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
