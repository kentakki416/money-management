import { Response } from "express"

import { deletePaymentSourceResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { PaymentSourceRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 支払い元削除API
 */
export class PaymentSourceDeleteController {
  constructor(private paymentSourceRepository: PaymentSourceRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id, 10)

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = { error: "Invalid payment source ID", status_code: 400 }
        return res.status(400).json(errorResponse)
      }

      await service.paymentSource.deletePaymentSource(id, this.paymentSourceRepository)

      const response = deletePaymentSourceResponseSchema.parse({ success: true })
      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "PaymentSourceDeleteController: Failed to delete payment source",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to delete payment source",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
