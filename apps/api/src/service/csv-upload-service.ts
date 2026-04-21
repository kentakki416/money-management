import crypto from "crypto"

import { PaymentSourceType } from "@repo/api-schema"

import { logger } from "../log"
import { decodeCsvBuffer } from "../utils/decode-csv-buffer"
import {
  CategoryRuleRepository,
  CreateTransactionInput,
  CsvUploadRepository,
  TransactionRepository,
  UserCategoryRuleRepository,
} from "../repository/mysql"
import { CsvUpload } from "../types/domain"
import { conflictError, err, notFoundError, ok, Result } from "../types/result"

import { categorizeManyDescriptions } from "./categorize-service"
import { getCsvParser } from "./csv-parser"

/**
 * CSVアップロード成功時の返却データ
 */
export type UploadCsvSuccess = {
  csvUpload: CsvUpload
  importedCount: number
}

/**
 * CSVファイルをアップロードして取引を一括登録する
 * 同一ユーザーで同名ファイルが既に存在する場合や、内容の重複がある場合は
 * 例外ではなく Result.err（業務エラー）として返す
 *
 * DB 障害などの予期しないエラーは通常通り throw する
 */
export const uploadCsv = async (
  data: {
    fileBuffer: Buffer
    fileName: string
    paymentSourceId: number
    paymentSourceType: PaymentSourceType
    userId: number
  },
  transactionRepository: TransactionRepository,
  csvUploadRepository: CsvUploadRepository,
  categoryRuleRepository: CategoryRuleRepository,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<Result<UploadCsvSuccess>> => {
  logger.debug("CsvUploadService: Starting CSV upload", { fileName: data.fileName })

  /**
   * ファイル名での重複チェック（同一ユーザー内）
   */
  const isDuplicateFileName = await csvUploadRepository.existsByFileName(
    data.userId,
    data.fileName
  )
  if (isDuplicateFileName) {
    logger.warn("CsvUploadService: Duplicate file name detected", {
      fileName: data.fileName,
      userId: data.userId,
    })
    return err(
      conflictError(`同名のファイル「${data.fileName}」はすでにアップロード済みです`)
    )
  }

  const fileHash = crypto.createHash("sha256").update(data.fileBuffer).digest("hex")

  const isDuplicateHash = await csvUploadRepository.existsByHash(fileHash)
  if (isDuplicateHash) {
    logger.warn("CsvUploadService: Duplicate CSV detected", { fileHash })
    return err(conflictError("このCSVファイルはすでにアップロード済みです"))
  }

  const content = decodeCsvBuffer(data.fileBuffer)
  const parser = getCsvParser(data.paymentSourceType)
  const parsed = parser(content)

  logger.debug("CsvUploadService: Parsed CSV rows", { count: parsed.length })

  const descriptions = parsed.map((p) => p.description)
  const categoryIds = await categorizeManyDescriptions(
    data.userId,
    descriptions,
    categoryRuleRepository,
    userCategoryRuleRepository
  )

  const csvUpload = await csvUploadRepository.create({
    fileHash,
    fileName: data.fileName,
    paymentSourceId: data.paymentSourceId,
    rowCount: parsed.length,
    userId: data.userId,
  })

  const transactionInputs: CreateTransactionInput[] = parsed.map((p, index) => ({
    amount: p.amount,
    categoryId: categoryIds[index],
    csvUploadId: csvUpload.id,
    description: p.description,
    isManual: false,
    paymentSourceId: data.paymentSourceId,
    transactionDate: p.transactionDate,
    userId: data.userId,
  }))

  await transactionRepository.createMany(transactionInputs)

  logger.debug("CsvUploadService: CSV upload completed", {
    csvUploadId: csvUpload.id,
    importedCount: parsed.length,
  })

  return ok({ csvUpload, importedCount: parsed.length })
}

/**
 * ユーザーのCSVアップロード履歴を取得する
 */
export const getUploadHistory = async (
  userId: number,
  csvUploadRepository: CsvUploadRepository
): Promise<Result<CsvUpload[]>> => {
  logger.debug("CsvUploadService: Fetching upload history", { userId })
  const history = await csvUploadRepository.findByUserId(userId)
  logger.debug("CsvUploadService: Upload history fetched", { count: history.length })
  return ok(history)
}

/**
 * CSVアップロード削除成功時の返却データ
 */
export type DeleteCsvUploadSuccess = {
  deletedTransactionCount: number
}

/**
 * CSVアップロードとそれに紐づく取引を削除する
 * 所有権チェック（CSV が当該ユーザーのものか）→ 削除 の順に実行
 */
export const deleteCsvUpload = async (
  id: number,
  userId: number,
  csvUploadRepository: CsvUploadRepository
): Promise<Result<DeleteCsvUploadSuccess>> => {
  logger.debug("CsvUploadService: Deleting CSV upload", { id, userId })

  const existing = await csvUploadRepository.findByIdAndUser(id, userId)
  if (!existing) {
    logger.warn("CsvUploadService: CSV upload not found or not owned by user", { id, userId })
    return err(notFoundError("CSV upload not found"))
  }

  const { deletedTransactionCount } = await csvUploadRepository.deleteByIdWithTransactions(id, userId)

  logger.debug("CsvUploadService: CSV upload deleted", { deletedTransactionCount, id })
  return ok({ deletedTransactionCount })
}
