import { Response } from "express"

import { ErrorResponse, trendRequestSchema, trendResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { SummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 月次推移取得API
 */
export class SummaryTrendController {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const query = trendRequestSchema.parse(req.query)
    const months = query.months ?? 12

    const result = await service.summary.getTrend(userId, months, { summaryRepository: this.summaryRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = trendResponseSchema.parse({
      categories: result.value.categories.map((c) => ({
        category_color: c.categoryColor,
        category_id: c.categoryId,
        category_name: c.categoryName,
        data: c.data.map((d) => ({
          amount: d.amount,
          month: d.month,
          year: d.year,
        })),
      })),
      months: result.value.months.map((m) => ({
        month: m.month,
        year: m.year,
      })),
      total: result.value.total.map((t) => ({
        amount: t.amount,
        month: t.month,
        year: t.year,
      })),
    })
    return res.status(200).json(response)
  }
}
