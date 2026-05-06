import { Response } from "express"

import { ErrorResponse, updateUserCategoryRulePathParamSchema, updateUserCategoryRuleRequestSchema, updateUserCategoryRuleResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール更新API
 */
export class UserCategoryRuleUpdateController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const { id } = updateUserCategoryRulePathParamSchema.parse(req.params)
    const userId = req.userId!

    const data = updateUserCategoryRuleRequestSchema.parse(req.body)

    const result = await service.userCategoryRule.updateUserCategoryRule(
      id,
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

    const response = updateUserCategoryRuleResponseSchema.parse({
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
    return res.status(200).json(response)
  }
}
