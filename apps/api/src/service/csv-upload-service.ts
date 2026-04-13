import crypto from "crypto"

import { PaymentSourceType } from "@repo/api-schema"

import { logger } from "../log"
import {
  CategoryRuleRepository,
  CreateTransactionInput,
  CsvUploadRepository,
  TransactionRepository,
  UserCategoryRuleRepository,
} from "../repository/mysql"
import { CsvUpload } from "../types/domain"

import { categorizeManyDescriptions } from "./categorize-service"
import { getCsvParser } from "./csv-parser"

/**
 * CSVファイルをアップロードして取引を一括登録する
 * 重複ファイルは拒否する（SHA-256ハッシュで判定）
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
): Promise<{ csvUpload: CsvUpload; importedCount: number }> => {
  logger.debug("CsvUploadService: Starting CSV upload", { fileName: data.fileName })

  const fileHash = crypto.createHash("sha256").update(data.fileBuffer).digest("hex")

  const isDuplicate = await csvUploadRepository.existsByHash(fileHash)
  if (isDuplicate) {
    logger.warn("CsvUploadService: Duplicate CSV detected", { fileHash })
    throw new Error("このCSVファイルはすでにアップロード済みです")
  }

  const content = data.fileBuffer.toString("utf-8")
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

  return { csvUpload, importedCount: parsed.length }
}

/**
 * ユーザーのCSVアップロード履歴を取得する
 */
export const getUploadHistory = async (
  userId: number,
  csvUploadRepository: CsvUploadRepository
): Promise<CsvUpload[]> => {
  logger.debug("CsvUploadService: Fetching upload history", { userId })
  const history = await csvUploadRepository.findByUserId(userId)
  logger.debug("CsvUploadService: Upload history fetched", { count: history.length })
  return history
}
