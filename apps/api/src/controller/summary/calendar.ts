import { Response } from "express"

import { ErrorResponse, calendarSummaryRequestSchema, calendarSummaryResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { SummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カレンダー用日別集計API
 */
export class SummaryCalendarController {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const query = calendarSummaryRequestSchema.parse(req.query)

    const result = await service.summary.getCalendarSummary(
      userId,
      query.year,
      query.month,
      { summaryRepository: this.summaryRepository }
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = calendarSummaryResponseSchema.parse({
      days: result.value.days.map((d) => ({
        amount: d.amount,
        date: d.date,
        transaction_count: d.transactionCount,
      })),
      month: result.value.month,
      total_amount: result.value.totalAmount,
      year: result.value.year,
    })
    return res.status(200).json(response)
  }
}
