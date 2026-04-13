import { Response } from "express"

import { ErrorResponse, getPaymentSourceListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { PaymentSourceRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 支払い元一覧取得API
 */
export class PaymentSourceListController {
  constructor(private paymentSourceRepository: PaymentSourceRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const paymentSources = await service.paymentSource.getPaymentSources(
        userId,
        this.paymentSourceRepository
      )

      const response = getPaymentSourceListResponseSchema.parse({
        payment_sources: paymentSources.map((p) => ({
          created_at: p.createdAt.toISOString(),
          id: p.id,
          name: p.name,
          type: p.type,
          user_id: p.userId,
        })),
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "PaymentSourceListController: Failed to get payment sources",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get payment sources",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
