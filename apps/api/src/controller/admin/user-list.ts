import { Request, Response } from "express"

import { ErrorResponse, getAdminUserListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { UserSummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面ユーザー一覧API
 */
export class AdminUserListController {
  constructor(private userSummaryRepository: UserSummaryRepository) {}

  async execute(_req: Request, res: Response) {
    try {
      const users = await service.admin.getAllUsers(this.userSummaryRepository)

      const response = getAdminUserListResponseSchema.parse({
        total: users.length,
        users: users.map((u) => ({
          id: u.id,
          avatar_url: u.avatarUrl,
          csv_upload_count: u.csvUploadCount,
          email: u.email,
          name: u.name,
          transaction_count: u.transactionCount,
          created_at: u.createdAt.toISOString(),
        })),
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "AdminUserListController: Failed to get user list",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get user list",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
