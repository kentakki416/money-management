import { logger } from "../log"
import {
  CategoryRuleRepository,
  CreateTransactionInput,
  TransactionFilter,
  TransactionRepository,
  UpdateTransactionInput,
  UserCategoryRuleRepository,
} from "../repository/mysql"
import { Transaction } from "../types/domain"

import { categorizeDescription } from "./categorize-service"

/**
 * 取引一覧をフィルタ条件で取得する
 */
export const getAllTransactions = async (
  filter: TransactionFilter,
  transactionRepository: TransactionRepository
): Promise<{ totalAmount: number; transactions: Transaction[] }> => {
  logger.debug("TransactionService: Fetching transactions", { filter })
  const transactions = await transactionRepository.findByFilter(filter)
  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
  logger.debug("TransactionService: Transactions fetched", { count: transactions.length, totalAmount })
  return { totalAmount, transactions }
}

/**
 * 取引を手動作成する
 * カテゴリ未指定の場合は自動分類を行う
 */
export const createManualTransaction = async (
  data: {
    amount: number
    categoryId?: number
    description: string
    paymentSourceId: number
    transactionDate: Date
    userId: number
  },
  transactionRepository: TransactionRepository,
  categoryRuleRepository: CategoryRuleRepository,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<Transaction> => {
  logger.debug("TransactionService: Creating manual transaction", { description: data.description })

  let categoryId = data.categoryId
  if (categoryId === undefined || categoryId === null) {
    categoryId = await categorizeDescription(
      data.userId,
      data.description,
      categoryRuleRepository,
      userCategoryRuleRepository
    )
    logger.debug("TransactionService: Auto-categorized", { categoryId, description: data.description })
  }

  const input: CreateTransactionInput = {
    amount: data.amount,
    categoryId,
    description: data.description,
    isManual: true,
    paymentSourceId: data.paymentSourceId,
    transactionDate: data.transactionDate,
    userId: data.userId,
  }

  const transaction = await transactionRepository.create(input)
  logger.debug("TransactionService: Transaction created", { id: transaction.id })
  return transaction
}

/**
 * 取引を更新する
 * カテゴリが変更された場合はユーザールールを自動作成/更新する
 */
export const updateTransaction = async (
  id: number,
  data: UpdateTransactionInput,
  previousCategoryId: number | null | undefined,
  description: string,
  userId: number,
  transactionRepository: TransactionRepository,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<Transaction> => {
  logger.debug("TransactionService: Updating transaction", { id })

  const transaction = await transactionRepository.update(id, data)

  if (
    data.categoryId !== undefined &&
    data.categoryId !== null &&
    data.categoryId !== previousCategoryId
  ) {
    logger.debug("TransactionService: Category changed, upserting user rule", {
      categoryId: data.categoryId,
      description,
    })
    await userCategoryRuleRepository.upsertByKeyword(userId, description, data.categoryId)
  }

  logger.debug("TransactionService: Transaction updated", { id: transaction.id })
  return transaction
}

/**
 * 取引を削除する
 */
export const deleteTransaction = async (
  id: number,
  transactionRepository: TransactionRepository
): Promise<boolean> => {
  logger.debug("TransactionService: Deleting transaction", { id })
  await transactionRepository.deleteById(id)
  logger.debug("TransactionService: Transaction deleted", { id })
  return true
}
