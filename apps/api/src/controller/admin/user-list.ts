import { Request, Response } from "express"

import { ErrorResponse, getAdminUserListResponseSchema } from "@repo/api-schema"

import { UserSummaryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面ユーザー一覧API
 */
export class AdminUserListController {
  constructor(private userSummaryRepository: UserSummaryRepository) {}

  async execute(_req: Request, res: Response) {
    const result = await service.admin.getAllUsers(this.userSummaryRepository)

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getAdminUserListResponseSchema.parse({
      total: result.value.length,
      users: result.value.map((u) => ({
        id: u.id,
        avatar_url: u.avatarUrl,
        csv_upload_count: u.csvUploadCount,
        email: u.email,
        name: u.name,
        transaction_count: u.transactionCount,
        created_at: u.createdAt.toISOString(),
      })),
    })
    return res.status(200).json(response)
  }
}
