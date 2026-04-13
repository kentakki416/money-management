import { Response } from "express"

import { ErrorResponse, trendRequestSchema, trendResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { SummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 月次推移取得API
 */
export class SummaryTrendController {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const query = trendRequestSchema.parse(req.query)
      const months = query.months ?? 12

      const { categories, months: monthLabels, total } = await service.summary.getTrend(
        userId,
        months,
        this.summaryRepository
      )

      const response = trendResponseSchema.parse({
        categories: categories.map((c) => ({
          category_color: c.categoryColor,
          category_id: c.categoryId,
          category_name: c.categoryName,
          data: c.data.map((d) => ({
            amount: d.amount,
            month: d.month,
            year: d.year,
          })),
        })),
        months: monthLabels.map((m) => ({
          month: m.month,
          year: m.year,
        })),
        total: total.map((t) => ({
          amount: t.amount,
          month: t.month,
          year: t.year,
        })),
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "SummaryTrendController: Failed to get trend",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get trend",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
