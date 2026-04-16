import { Request, Response } from "express"

import { ErrorResponse, updateCategoryRulePathParamSchema, updateCategoryRuleRequestSchema, updateCategoryRuleResponseSchema } from "@repo/api-schema"

import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリルール更新API
 */
export class AdminCategoryRuleUpdateController {
  constructor(private categoryRuleRepository: CategoryRuleRepository) {}

  async execute(req: Request, res: Response) {
    const { id } = updateCategoryRulePathParamSchema.parse(req.params)

    const data = updateCategoryRuleRequestSchema.parse(req.body)

    const result = await service.categoryRule.updateCategoryRule(
      id,
      {
        categoryId: data.category_id,
        keyword: data.keyword,
        matchType: data.match_type,
        priority: data.priority,
      },
      this.categoryRuleRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = updateCategoryRuleResponseSchema.parse({
      rule: {
        id: result.value.id,
        category_id: result.value.categoryId,
        category_name: result.value.categoryName,
        keyword: result.value.keyword,
        match_type: result.value.matchType,
        priority: result.value.priority,
        created_at: result.value.createdAt.toISOString(),
        updated_at: result.value.updatedAt.toISOString(),
      },
    })
    return res.status(200).json(response)
  }
}
