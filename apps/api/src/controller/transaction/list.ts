import { Response } from "express"

import { ErrorResponse, getTransactionListRequestSchema, getTransactionListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { TransactionRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 取引一覧取得API
 */
export class TransactionListController {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const query = getTransactionListRequestSchema.parse(req.query)

      const { totalAmount, transactions } = await service.transaction.getAllTransactions(
        {
          categoryId: query.category_id,
          date: query.date,
          month: query.month,
          paymentSourceId: query.payment_source_id,
          userId,
          year: query.year,
        },
        this.transactionRepository
      )

      const response = getTransactionListResponseSchema.parse({
        total_amount: totalAmount,
        transactions: transactions.map((t) => ({
          amount: t.amount,
          category_color: t.categoryColor,
          category_id: t.categoryId,
          category_name: t.categoryName,
          created_at: t.createdAt.toISOString(),
          csv_upload_id: t.csvUploadId,
          description: t.description,
          id: t.id,
          is_manual: t.isManual,
          payment_source_id: t.paymentSourceId,
          payment_source_name: t.paymentSourceName,
          transaction_date: t.transactionDate.toISOString().split("T")[0],
          updated_at: t.updatedAt.toISOString(),
          user_id: t.userId,
        })),
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "TransactionListController: Failed to get transactions",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get transactions",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
