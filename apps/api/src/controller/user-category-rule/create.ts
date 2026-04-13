import { Response } from "express"

import { createUserCategoryRuleRequestSchema, createUserCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール作成API
 */
export class UserCategoryRuleCreateController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!
      const data = createUserCategoryRuleRequestSchema.parse(req.body)

      const rule = await service.userCategoryRule.createUserCategoryRule(
        userId,
        {
          categoryId: data.category_id,
          keyword: data.keyword,
          matchType: data.match_type,
          priority: data.priority,
        },
        this.userCategoryRuleRepository
      )

      const response = createUserCategoryRuleResponseSchema.parse({
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

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "UserCategoryRuleCreateController: Failed to create user category rule",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to create user category rule",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
