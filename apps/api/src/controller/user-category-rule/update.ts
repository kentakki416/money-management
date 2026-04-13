import { Response } from "express"

import { ErrorResponse, updateUserCategoryRuleRequestSchema, updateUserCategoryRuleResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール更新API
 */
export class UserCategoryRuleUpdateController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id)
      const userId = req.userId!

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = {
          error: "Invalid user category rule ID",
          status_code: 400,
        }
        return res.status(400).json(errorResponse)
      }

      const data = updateUserCategoryRuleRequestSchema.parse(req.body)

      const rule = await service.userCategoryRule.updateUserCategoryRule(
        id,
        userId,
        {
          categoryId: data.category_id,
          keyword: data.keyword,
          matchType: data.match_type,
          priority: data.priority,
        },
        this.userCategoryRuleRepository
      )

      const response = updateUserCategoryRuleResponseSchema.parse({
        rule: {
          category_id: rule.categoryId,
          category_name: rule.categoryName,
          created_at: rule.createdAt.toISOString(),
          id: rule.id,
          keyword: rule.keyword,
          match_type: rule.matchType,
          priority: rule.priority,
          updated_at: rule.updatedAt.toISOString(),
          user_id: rule.userId,
        },
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "UserCategoryRuleUpdateController: Failed to update user category rule",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to update user category rule",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
