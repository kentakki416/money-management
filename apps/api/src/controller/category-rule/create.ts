import { Request, Response } from "express"

import { createCategoryRuleRequestSchema, createCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリルール作成API
 */
export class CategoryRuleCreateController {
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
          category_id: rule.categoryId,
          category_name: rule.categoryName,
          created_at: rule.createdAt.toISOString(),
          id: rule.id,
          keyword: rule.keyword,
          match_type: rule.matchType,
          priority: rule.priority,
          updated_at: rule.updatedAt.toISOString(),
        },
      })

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "CategoryRuleCreateController: Failed to create category rule",
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
