import { Response } from "express"

import { ErrorResponse, getUserCategoryRuleListResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール一覧取得API
 */
export class UserCategoryRuleListController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const result = await service.userCategoryRule.getUserCategoryRules(
      userId,
      { userCategoryRuleRepository: this.userCategoryRuleRepository }
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getUserCategoryRuleListResponseSchema.parse({
      rules: result.value.map((r) => ({
        category_id: r.categoryId,
        category_name: r.categoryName,
        created_at: r.createdAt.toISOString(),
        id: r.id,
        keyword: r.keyword,
        match_type: r.matchType,
        priority: r.priority,
        updated_at: r.updatedAt.toISOString(),
        user_id: r.userId,
      })),
    })
    return res.status(200).json(response)
  }
}
