import { Request, Response } from "express"

import { ErrorResponse, getAdminUserDetailResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { UserSummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面ユーザー詳細API
 */
export class AdminUserDetailController {
  constructor(private userSummaryRepository: UserSummaryRepository) {}

  async execute(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = {
          error: "Invalid user ID",
          status_code: 400,
        }
        return res.status(400).json(errorResponse)
      }

      const user = await service.admin.getUserDetail(id, this.userSummaryRepository)

      if (!user) {
        const errorResponse: ErrorResponse = {
          error: "User not found",
          status_code: 404,
        }
        return res.status(404).json(errorResponse)
      }

      const response = getAdminUserDetailResponseSchema.parse({
        user: {
          id: user.id,
          avatar_url: user.avatarUrl,
          csv_upload_count: user.csvUploadCount,
          email: user.email,
          name: user.name,
          payment_sources: user.paymentSources,
          transaction_count: user.transactionCount,
          created_at: user.createdAt.toISOString(),
        },
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "AdminUserDetailController: Failed to get user detail",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get user detail",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
