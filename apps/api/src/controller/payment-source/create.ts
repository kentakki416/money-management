import { Response } from "express"

import { createPaymentSourceRequestSchema, createPaymentSourceResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { PaymentSourceRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 支払い元作成API
 */
export class PaymentSourceCreateController {
  constructor(private paymentSourceRepository: PaymentSourceRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!

      const data = createPaymentSourceRequestSchema.parse(req.body)

      const paymentSource = await service.paymentSource.createPaymentSource(
        {
          name: data.name,
          type: data.type,
          userId,
        },
        this.paymentSourceRepository
      )

      const response = createPaymentSourceResponseSchema.parse({
        payment_source: {
          created_at: paymentSource.createdAt.toISOString(),
          id: paymentSource.id,
          name: paymentSource.name,
          type: paymentSource.type,
          user_id: paymentSource.userId,
        },
      })

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "PaymentSourceCreateController: Failed to create payment source",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to create payment source",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
