import { Request, Response } from "express"

import { deleteCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリルール削除API
 */
export class CategoryRuleDeleteController {
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

      await service.categoryRule.deleteCategoryRule(id, this.categoryRuleRepository)

      const response = deleteCategoryRuleResponseSchema.parse({ success: true })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "CategoryRuleDeleteController: Failed to delete category rule",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to delete category rule",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
