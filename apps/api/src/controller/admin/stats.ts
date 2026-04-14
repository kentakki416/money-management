import { Request, Response } from "express"

import { ErrorResponse, RegistrationPeriod, adminStatsResponseSchema, registrationPeriodSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CsvUploadRepository, UserRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面ダッシュボード統計API
 */
export class AdminStatsController {
  constructor(
    private userRepository: UserRepository,
    private csvUploadRepository: CsvUploadRepository
  ) {}

  async execute(req: Request, res: Response) {
    try {
      const periodParam = req.query.period as string | undefined
      const parsed = registrationPeriodSchema.safeParse(periodParam)
      const period: RegistrationPeriod = parsed.success ? parsed.data : "yearly"

      const stats = await service.admin.getStats(period, this.userRepository, this.csvUploadRepository)

      const response = adminStatsResponseSchema.parse({
        registrations: stats.registrations,
        total_csv_uploads: stats.totalCsvUploads,
        total_users: stats.totalUsers,
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "AdminStatsController: Failed to get admin stats",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get admin stats",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
