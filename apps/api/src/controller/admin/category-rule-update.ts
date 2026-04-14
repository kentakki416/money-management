import { Request, Response } from "express"

import { ErrorResponse , updateCategoryRuleRequestSchema, updateCategoryRuleResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリルール更新API
 */
export class AdminCategoryRuleUpdateController {
  constructor(private categoryRuleRepository: CategoryRuleRepository) {}

  async execute(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = {
          error: "Invalid category rule ID",
          status_code: 400,
        }
        return res.status(400).json(errorResponse)
      }

      const data = updateCategoryRuleRequestSchema.parse(req.body)

      const rule = await service.categoryRule.updateCategoryRule(
        id,
        {
          categoryId: data.category_id,
          keyword: data.keyword,
          matchType: data.match_type,
          priority: data.priority,
        },
        this.categoryRuleRepository
      )

      const response = updateCategoryRuleResponseSchema.parse({
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

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "AdminCategoryRuleUpdateController: Failed to update category rule",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to update category rule",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
