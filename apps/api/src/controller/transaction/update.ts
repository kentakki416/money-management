import { Response } from "express"

import { ErrorResponse, updateTransactionPathParamSchema, updateTransactionRequestSchema, updateTransactionResponseSchema } from "@repo/api-schema"

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
    const userId = req.userId!
    const { id } = updateTransactionPathParamSchema.parse(req.params)

    const data = updateTransactionRequestSchema.parse(req.body)

    const existing = await this.transactionRepository.findByFilter({ userId })
    const existingTransaction = existing.find((t) => t.id === id)

    if (!existingTransaction) {
      const errorResponse: ErrorResponse = { error: "Transaction not found", status_code: 404 }
      return res.status(404).json(errorResponse)
    }

    const result = await service.transaction.updateTransaction(
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

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = updateTransactionResponseSchema.parse({
      transaction: {
        amount: result.value.amount,
        category_color: result.value.categoryColor,
        category_id: result.value.categoryId,
        category_name: result.value.categoryName,
        created_at: result.value.createdAt.toISOString(),
        csv_upload: result.value.csvUpload
          ? {
            file_name: result.value.csvUpload.fileName,
            id: result.value.csvUpload.id,
            uploaded_at: result.value.csvUpload.uploadedAt.toISOString(),
          }
          : null,
        csv_upload_id: result.value.csvUploadId,
        description: result.value.description,
        id: result.value.id,
        is_manual: result.value.isManual,
        payment_source_color: result.value.paymentSourceColor,
        payment_source_id: result.value.paymentSourceId,
        payment_source_name: result.value.paymentSourceName,
        transaction_date: result.value.transactionDate.toISOString().split("T")[0],
        updated_at: result.value.updatedAt.toISOString(),
        user_id: result.value.userId,
      },
    })
    return res.status(200).json(response)
  }
}
