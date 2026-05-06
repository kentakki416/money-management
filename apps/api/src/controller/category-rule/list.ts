import { Request, Response } from "express"

import { ErrorResponse, getCategoryRuleListResponseSchema } from "@repo/api-schema"

import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリルール一覧取得API
 */
export class CategoryRuleListController {
  constructor(private categoryRuleRepository: CategoryRuleRepository) {}

  async execute(_req: Request, res: Response) {
    const result = await service.categoryRule.getAllCategoryRules({ categoryRuleRepository: this.categoryRuleRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getCategoryRuleListResponseSchema.parse({
      rules: result.value.map((r) => ({
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
    return res.status(200).json(response)
  }
}
