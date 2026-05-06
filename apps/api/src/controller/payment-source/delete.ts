import { Response } from "express"

import { deletePaymentSourcePathParamSchema, deletePaymentSourceResponseSchema, ErrorResponse } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { PaymentSourceRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 支払い元削除API
 */
export class PaymentSourceDeleteController {
  constructor(private paymentSourceRepository: PaymentSourceRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const { id } = deletePaymentSourcePathParamSchema.parse(req.params)

    const result = await service.paymentSource.deletePaymentSource(id, { paymentSourceRepository: this.paymentSourceRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = deletePaymentSourceResponseSchema.parse({ success: true })
    return res.status(200).json(response)
  }
}
