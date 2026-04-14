import { logger } from "../log"
import { CsvUploadRepository, UserRepository, UserSummaryRepository } from "../repository/mysql"
import { RegistrationPeriod } from "../types/domain"

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
  userRepository: UserRepository,
  csvUploadRepository: CsvUploadRepository
) => {
  logger.debug("admin.getStats: start", { period })
  if (isUsingDummy()) {
    logger.debug("admin.getStats: returning dummy data")
    return {
      registrations: DUMMY_REGISTRATIONS[period],
      totalCsvUploads: DUMMY_TOTAL_CSV_UPLOADS,
      totalUsers: DUMMY_TOTAL_USERS,
    }
  }
  const [totalUsers, totalCsvUploads, registrations] = await Promise.all([
    userRepository.count(),
    csvUploadRepository.count(),
    userRepository.countRegistrationsByPeriod(period),
  ])
  logger.debug("admin.getStats: done")
  return { registrations, totalCsvUploads, totalUsers }
}

/**
 * 全ユーザー一覧を取得する
 */
export const getAllUsers = async (userSummaryRepository: UserSummaryRepository) => {
  logger.debug("admin.getAllUsers: start")
  if (isUsingDummy()) {
    logger.debug("admin.getAllUsers: returning dummy data")
    return DUMMY_USERS
  }
  const users = await userSummaryRepository.findAllWithCounts()
  logger.debug("admin.getAllUsers: done")
  return users
}

/**
 * ユーザー詳細を取得する
 */
export const getUserDetail = async (id: number, userSummaryRepository: UserSummaryRepository) => {
  logger.debug("admin.getUserDetail: start", { id })
  if (isUsingDummy()) {
    logger.debug("admin.getUserDetail: returning dummy data", { id })
    return getDummyUserDetail(id)
  }
  const user = await userSummaryRepository.findByIdWithDetail(id)
  logger.debug("admin.getUserDetail: done", { id })
  return user
}
