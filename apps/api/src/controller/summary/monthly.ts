import { Response } from "express"

import { ErrorResponse, monthlySummaryRequestSchema, monthlySummaryResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { SummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 月間カテゴリ別集計API
 */
export class SummaryMonthlyController {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const query = monthlySummaryRequestSchema.parse(req.query)

      const { categories, month, totalAmount, year } = await service.summary.getMonthlySummary(
        userId,
        query.year,
        query.month,
        this.summaryRepository
      )

      const response = monthlySummaryResponseSchema.parse({
        categories: categories.map((c) => ({
          amount: c.amount,
          category_color: c.categoryColor,
          category_id: c.categoryId,
          category_name: c.categoryName,
          percentage: c.percentage,
        })),
        month,
        total_amount: totalAmount,
        year,
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "SummaryMonthlyController: Failed to get monthly summary",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get monthly summary",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
