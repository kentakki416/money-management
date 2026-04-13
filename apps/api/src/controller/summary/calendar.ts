import { Response } from "express"

import { calendarSummaryRequestSchema, calendarSummaryResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { SummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カレンダー用日別集計API
 */
export class SummaryCalendarController {
  constructor(private summaryRepository: SummaryRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const query = calendarSummaryRequestSchema.parse(req.query)

      const { days, month, totalAmount, year } = await service.summary.getCalendarSummary(
        userId,
        query.year,
        query.month,
        this.summaryRepository
      )

      const response = calendarSummaryResponseSchema.parse({
        days: days.map((d) => ({
          amount: d.amount,
          date: d.date,
          transaction_count: d.transactionCount,
        })),
        month,
        total_amount: totalAmount,
        year,
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "SummaryCalendarController: Failed to get calendar summary",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get calendar summary",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
