import { Response } from "express"

import { ErrorResponse, createTransactionRequestSchema, createTransactionResponseSchema } from "@repo/api-schema"

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
    const userId = req.userId!
    const data = createTransactionRequestSchema.parse(req.body)

    const result = await service.transaction.createManualTransaction(
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

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = createTransactionResponseSchema.parse({
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
    return res.status(201).json(response)
  }
}
