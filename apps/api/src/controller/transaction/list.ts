import { Response } from "express"

import { ErrorResponse, getTransactionListRequestSchema, getTransactionListResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { TransactionRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 取引一覧取得API
 */
export class TransactionListController {
  constructor(private transactionRepository: TransactionRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const query = getTransactionListRequestSchema.parse(req.query)

    const result = await service.transaction.getAllTransactions(
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

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getTransactionListResponseSchema.parse({
      total_amount: result.value.totalAmount,
      transactions: result.value.transactions.map((t) => ({
        amount: t.amount,
        category_color: t.categoryColor,
        category_id: t.categoryId,
        category_name: t.categoryName,
        created_at: t.createdAt.toISOString(),
        csv_upload: t.csvUpload
          ? {
            file_name: t.csvUpload.fileName,
            id: t.csvUpload.id,
            uploaded_at: t.csvUpload.uploadedAt.toISOString(),
          }
          : null,
        csv_upload_id: t.csvUploadId,
        description: t.description,
        id: t.id,
        is_manual: t.isManual,
        payment_source_color: t.paymentSourceColor,
        payment_source_id: t.paymentSourceId,
        payment_source_name: t.paymentSourceName,
        transaction_date: t.transactionDate.toISOString().split("T")[0],
        updated_at: t.updatedAt.toISOString(),
        user_id: t.userId,
      })),
    })
    return res.status(200).json(response)
  }
}
