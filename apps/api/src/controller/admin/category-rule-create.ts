import { Request, Response } from "express"

import { ErrorResponse , createCategoryRuleRequestSchema, createCategoryRuleResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリルール作成API
 */
export class AdminCategoryRuleCreateController {
  constructor(private categoryRuleRepository: CategoryRuleRepository) {}

  async execute(req: Request, res: Response) {
    try {
      const data = createCategoryRuleRequestSchema.parse(req.body)

      const rule = await service.categoryRule.createCategoryRule(
        {
          categoryId: data.category_id,
          keyword: data.keyword,
          matchType: data.match_type,
          priority: data.priority,
        },
        this.categoryRuleRepository
      )

      const response = createCategoryRuleResponseSchema.parse({
        rule: {
          id: rule.id,
          category_id: rule.categoryId,
          category_name: rule.categoryName,
          keyword: rule.keyword,
          match_type: rule.matchType,
          priority: rule.priority,
          created_at: rule.createdAt.toISOString(),
          updated_at: rule.updatedAt.toISOString(),
        },
      })

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "AdminCategoryRuleCreateController: Failed to create category rule",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to create category rule",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
