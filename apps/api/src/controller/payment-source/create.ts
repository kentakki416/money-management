import { Response } from "express"

import { ErrorResponse, createPaymentSourceRequestSchema, createPaymentSourceResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { PaymentSourceRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 支払い元作成API
 */
export class PaymentSourceCreateController {
  constructor(private paymentSourceRepository: PaymentSourceRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!
    const data = createPaymentSourceRequestSchema.parse(req.body)

    const result = await service.paymentSource.createPaymentSource(
      {
        name: data.name,
        type: data.type,
        userId,
      },
      { paymentSourceRepository: this.paymentSourceRepository }
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = createPaymentSourceResponseSchema.parse({
      payment_source: {
        color: result.value.color,
        created_at: result.value.createdAt.toISOString(),
        id: result.value.id,
        name: result.value.name,
        type: result.value.type,
        user_id: result.value.userId,
      },
    })
    return res.status(201).json(response)
  }
}
