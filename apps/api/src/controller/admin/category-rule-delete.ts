import { Request, Response } from "express"

import { deleteCategoryRulePathParamSchema, deleteCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリルール削除API
 */
export class AdminCategoryRuleDeleteController {
  constructor(private categoryRuleRepository: CategoryRuleRepository) {}

  async execute(req: Request, res: Response) {
    const { id } = deleteCategoryRulePathParamSchema.parse(req.params)

    const result = await service.categoryRule.deleteCategoryRule(id, this.categoryRuleRepository)

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = deleteCategoryRuleResponseSchema.parse({ success: true })
    return res.status(200).json(response)
  }
}
