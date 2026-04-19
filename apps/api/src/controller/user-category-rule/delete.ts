import { Response } from "express"

import { deleteUserCategoryRulePathParamSchema, deleteUserCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { CategoryRuleRepository, TransactionRepository, UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール削除API
 */
export class UserCategoryRuleDeleteController {
  constructor(
    private userCategoryRuleRepository: UserCategoryRuleRepository,
    private transactionRepository: TransactionRepository,
    private categoryRuleRepository: CategoryRuleRepository,
  ) {}

  async execute(req: AuthRequest, res: Response) {
    const { id } = deleteUserCategoryRulePathParamSchema.parse(req.params)
    const userId = req.userId!

    /** 削除前にルール情報を取得（再分類対象のカテゴリIDを特定するため） */
    const rule = await this.userCategoryRuleRepository.findById(id, userId)
    const deletedRuleCategoryId = rule?.categoryId ?? null

    const result = await service.userCategoryRule.deleteUserCategoryRule(
      id,
      userId,
      this.userCategoryRuleRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    let reclassifiedCount = 0
    if (deletedRuleCategoryId !== null) {
      reclassifiedCount = await service.categorize.reclassifyTransactionsByDeletedRule(
        userId,
        deletedRuleCategoryId,
        this.transactionRepository,
        this.categoryRuleRepository,
        this.userCategoryRuleRepository,
      )
    }

    const response = deleteUserCategoryRuleResponseSchema.parse({
      reclassified_count: reclassifiedCount,
      success: true,
    })
    return res.status(200).json(response)
  }
}
