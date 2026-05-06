import { Request, Response } from "express"

import { ErrorResponse, getAdminUserDetailPathParamSchema, getAdminUserDetailResponseSchema } from "@repo/api-schema"

import { UserSummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面ユーザー詳細API
 */
export class AdminUserDetailController {
  constructor(private userSummaryRepository: UserSummaryRepository) {}

  async execute(req: Request, res: Response) {
    const { id } = getAdminUserDetailPathParamSchema.parse(req.params)

    const result = await service.admin.getUserDetail(id, { userSummaryRepository: this.userSummaryRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getAdminUserDetailResponseSchema.parse({
      user: {
        id: result.value.id,
        avatar_url: result.value.avatarUrl,
        csv_upload_count: result.value.csvUploadCount,
        email: result.value.email,
        name: result.value.name,
        payment_sources: result.value.paymentSources,
        transaction_count: result.value.transactionCount,
        created_at: result.value.createdAt.toISOString(),
      },
    })
    return res.status(200).json(response)
  }
}
