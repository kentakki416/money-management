import { logger } from "../log"
import { CsvUploadRepository, UserRepository, UserSummaryRepository } from "../repository/mysql"
import { RegistrationPeriod } from "../types/domain"
import { err, notFoundError, ok, Result } from "../types/result"

import {
  DUMMY_REGISTRATIONS,
  DUMMY_TOTAL_CSV_UPLOADS,
  DUMMY_TOTAL_USERS,
  DUMMY_USERS,
  getDummyUserDetail,
} from "./__fixtures__/admin-fixtures"

/**
 * ダミーモード判定（環境変数を毎回読み取る）
 */
const isUsingDummy = () => process.env.ADMIN_USE_DUMMY === "true"

/**
 * 管理画面用の統計情報を取得する
 */
export const getStats = async (
  period: RegistrationPeriod,
  repo: {
    csvUploadRepository: CsvUploadRepository
    userRepository: UserRepository
  }
): Promise<Result<{
  registrations: unknown
  totalCsvUploads: number
  totalUsers: number
}>> => {
  logger.debug("admin.getStats: start", { period })
  if (isUsingDummy()) {
    logger.debug("admin.getStats: returning dummy data")
    return ok({
      registrations: DUMMY_REGISTRATIONS[period],
      totalCsvUploads: DUMMY_TOTAL_CSV_UPLOADS,
      totalUsers: DUMMY_TOTAL_USERS,
    })
  }
  const [totalUsers, totalCsvUploads, registrations] = await Promise.all([
    repo.userRepository.count(),
    repo.csvUploadRepository.count(),
    repo.userRepository.countRegistrationsByPeriod(period),
  ])
  logger.debug("admin.getStats: done")
  return ok({ registrations, totalCsvUploads, totalUsers })
}

/**
 * 全ユーザー一覧を取得する
 */
export const getAllUsers = async (
  repo: { userSummaryRepository: UserSummaryRepository }
) => {
  logger.debug("admin.getAllUsers: start")
  if (isUsingDummy()) {
    logger.debug("admin.getAllUsers: returning dummy data")
    return ok(DUMMY_USERS)
  }
  const users = await repo.userSummaryRepository.findAllWithCounts()
  logger.debug("admin.getAllUsers: done")
  return ok(users)
}

/**
 * ユーザー詳細を取得する
 */
export const getUserDetail = async (
  id: number,
  repo: { userSummaryRepository: UserSummaryRepository }
) => {
  logger.debug("admin.getUserDetail: start", { id })
  if (isUsingDummy()) {
    logger.debug("admin.getUserDetail: returning dummy data", { id })
    const user = getDummyUserDetail(id)
    if (!user) {
      return err(notFoundError("User not found"))
    }
    return ok(user)
  }
  const user = await repo.userSummaryRepository.findByIdWithDetail(id)
  if (!user) {
    return err(notFoundError("User not found"))
  }
  logger.debug("admin.getUserDetail: done", { id })
  return ok(user)
}
