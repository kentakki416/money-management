import { Request, Response } from "express"

import { ErrorResponse, RegistrationPeriod, adminStatsResponseSchema, registrationPeriodSchema } from "@repo/api-schema"

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
    const periodParam = req.query.period as string | undefined
    const parsed = registrationPeriodSchema.safeParse(periodParam)
    const period: RegistrationPeriod = parsed.success ? parsed.data : "yearly"

    const result = await service.admin.getStats(period, this.userRepository, this.csvUploadRepository)

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = adminStatsResponseSchema.parse({
      registrations: result.value.registrations,
      total_csv_uploads: result.value.totalCsvUploads,
      total_users: result.value.totalUsers,
    })
    return res.status(200).json(response)
  }
}
