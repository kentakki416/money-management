import { Response } from "express"

import { ErrorResponse, getUserCategoryRuleListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール一覧取得API
 */
export class UserCategoryRuleListController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const rules = await service.userCategoryRule.getUserCategoryRules(
        userId,
        this.userCategoryRuleRepository
      )

      const response = getUserCategoryRuleListResponseSchema.parse({
        rules: rules.map((r) => ({
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

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "UserCategoryRuleListController: Failed to get user category rules",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get user category rules",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
