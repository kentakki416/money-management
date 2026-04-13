import { Request, Response } from "express"

import { ErrorResponse, getCategoryRuleListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリルール一覧取得API
 */
export class CategoryRuleListController {
  constructor(private categoryRuleRepository: CategoryRuleRepository) {}

  async execute(_req: Request, res: Response) {
    try {
      const rules = await service.categoryRule.getAllCategoryRules(this.categoryRuleRepository)

      const response = getCategoryRuleListResponseSchema.parse({
        rules: rules.map((r) => ({
          category_id: r.categoryId,
          category_name: r.categoryName,
          created_at: r.createdAt.toISOString(),
          id: r.id,
          keyword: r.keyword,
          match_type: r.matchType,
          priority: r.priority,
          updated_at: r.updatedAt.toISOString(),
        })),
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "CategoryRuleListController: Failed to get category rules",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get category rules",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
