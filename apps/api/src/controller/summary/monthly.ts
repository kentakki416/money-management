import { Response } from "express"

import { ErrorResponse, monthlySummaryRequestSchema, monthlySummaryResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { SummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 月間カテゴリ別集計API
 */
export class SummaryMonthlyController {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const query = monthlySummaryRequestSchema.parse(req.query)

    const result = await service.summary.getMonthlySummary(
      userId,
      query.year,
      query.month,
      this.summaryRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = monthlySummaryResponseSchema.parse({
      categories: result.value.categories.map((c) => ({
        amount: c.amount,
        category_color: c.categoryColor,
        category_id: c.categoryId,
        category_name: c.categoryName,
        percentage: c.percentage,
      })),
      month: result.value.month,
      total_amount: result.value.totalAmount,
      year: result.value.year,
    })
    return res.status(200).json(response)
  }
}
