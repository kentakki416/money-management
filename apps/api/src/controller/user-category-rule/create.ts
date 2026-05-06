import { Response } from "express"

import { ErrorResponse, createUserCategoryRuleRequestSchema, createUserCategoryRuleResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { CategoryRuleRepository, TransactionRepository, UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール作成API
 */
export class UserCategoryRuleCreateController {
  constructor(
    private userCategoryRuleRepository: UserCategoryRuleRepository,
    private transactionRepository: TransactionRepository,
    private categoryRuleRepository: CategoryRuleRepository,
  ) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const data = createUserCategoryRuleRequestSchema.parse(req.body)

    const result = await service.userCategoryRule.createUserCategoryRule(
      userId,
      {
        categoryId: data.category_id,
        keyword: data.keyword,
        matchType: data.match_type,
        priority: data.priority,
      },
      { userCategoryRuleRepository: this.userCategoryRuleRepository }
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const reclassifiedCount = await service.categorize.reclassifyUncategorizedTransactions(
      userId,
      {
        categoryRuleRepository: this.categoryRuleRepository,
        transactionRepository: this.transactionRepository,
        userCategoryRuleRepository: this.userCategoryRuleRepository,
      },
    )

    const response = createUserCategoryRuleResponseSchema.parse({
      reclassified_count: reclassifiedCount,
      rule: {
        category_id: result.value.categoryId,
        category_name: result.value.categoryName,
        created_at: result.value.createdAt.toISOString(),
        id: result.value.id,
        keyword: result.value.keyword,
        match_type: result.value.matchType,
        priority: result.value.priority,
        updated_at: result.value.updatedAt.toISOString(),
        user_id: result.value.userId,
      },
    })
    return res.status(201).json(response)
  }
}
