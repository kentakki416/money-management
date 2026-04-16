import { Response } from "express"

import { ErrorResponse, getPaymentSourceListResponseSchema } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { PaymentSourceRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 支払い元一覧取得API
 */
export class PaymentSourceListController {
  constructor(private paymentSourceRepository: PaymentSourceRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const userId = req.userId!

    const result = await service.paymentSource.getPaymentSources(
      userId,
      this.paymentSourceRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getPaymentSourceListResponseSchema.parse({
      payment_sources: result.value.map((p) => ({
        color: p.color,
        created_at: p.createdAt.toISOString(),
        id: p.id,
        name: p.name,
        type: p.type,
        user_id: p.userId,
      })),
    })
    return res.status(200).json(response)
  }
}
