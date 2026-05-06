import { logger } from "../log"
import { CategoryRuleRepository, TransactionRepository, UserCategoryRuleRepository } from "../repository/mysql"
import { convertFullWidthToHalfWidth } from "../utils/normalize"

const UNCATEGORIZED_ID = 99

type CategorizeRulesRepo = {
  categoryRuleRepository: CategoryRuleRepository
  userCategoryRuleRepository: UserCategoryRuleRepository
}

type ReclassifyRepo = {
  categoryRuleRepository: CategoryRuleRepository
  transactionRepository: TransactionRepository
  userCategoryRuleRepository: UserCategoryRuleRepository
}

/**
 * 説明文字列をカテゴリIDに分類する
 * ユーザールールを優先し、マッチしなければマスタールールを使用する
 */
export const categorizeDescription = async (
  userId: number,
  description: string,
  repo: CategorizeRulesRepo
): Promise<number> => {
  const normalized = convertFullWidthToHalfWidth(description).toLowerCase()

  const userRules = await repo.userCategoryRuleRepository.findByUserId(userId)
  for (const rule of userRules) {
    const keyword = convertFullWidthToHalfWidth(rule.keyword).toLowerCase()
    if (rule.matchType === "EXACT" && normalized === keyword) {
      return rule.categoryId
    }
    if (rule.matchType === "PARTIAL" && normalized.includes(keyword)) {
      return rule.categoryId
    }
  }

  const masterRules = await repo.categoryRuleRepository.findAll()
  for (const rule of masterRules) {
    const keyword = convertFullWidthToHalfWidth(rule.keyword).toLowerCase()
    if (rule.matchType === "EXACT" && normalized === keyword) {
      return rule.categoryId
    }
    if (rule.matchType === "PARTIAL" && normalized.includes(keyword)) {
      return rule.categoryId
    }
  }

  return UNCATEGORIZED_ID
}

/**
 * 複数の説明文字列を一括でカテゴリIDに分類する
 */
export const categorizeManyDescriptions = async (
  userId: number,
  descriptions: string[],
  repo: CategorizeRulesRepo
): Promise<number[]> => {
  const userRules = await repo.userCategoryRuleRepository.findByUserId(userId)
  const masterRules = await repo.categoryRuleRepository.findAll()

  return descriptions.map((description) => {
    const normalized = convertFullWidthToHalfWidth(description).toLowerCase()

    for (const rule of userRules) {
      const keyword = convertFullWidthToHalfWidth(rule.keyword).toLowerCase()
      if (rule.matchType === "EXACT" && normalized === keyword) {
        return rule.categoryId
      }
      if (rule.matchType === "PARTIAL" && normalized.includes(keyword)) {
        return rule.categoryId
      }
    }

    for (const rule of masterRules) {
      const keyword = convertFullWidthToHalfWidth(rule.keyword).toLowerCase()
      if (rule.matchType === "EXACT" && normalized === keyword) {
        return rule.categoryId
      }
      if (rule.matchType === "PARTIAL" && normalized.includes(keyword)) {
        return rule.categoryId
      }
    }

    return UNCATEGORIZED_ID
  })
}

/**
 * 未分類の取引を再分類し、分類できた件数を返す
 */
export const reclassifyUncategorizedTransactions = async (
  userId: number,
  repo: ReclassifyRepo
): Promise<number> => {
  const uncategorized = await repo.transactionRepository.findUncategorizedByUserId(userId)
  if (uncategorized.length === 0) return 0

  logger.debug("CategorizeService: Reclassifying uncategorized transactions", {
    count: uncategorized.length,
    userId,
  })

  const descriptions = uncategorized.map((t) => t.description)
  const categoryIds = await categorizeManyDescriptions(
    userId,
    descriptions,
    {
      categoryRuleRepository: repo.categoryRuleRepository,
      userCategoryRuleRepository: repo.userCategoryRuleRepository,
    }
  )

  /** カテゴリIDごとに取引IDをグルーピングして一括更新する */
  const categoryToTransactionIds = new Map<number, number[]>()
  categoryIds.forEach((categoryId, index) => {
    if (categoryId === UNCATEGORIZED_ID) return
    const ids = categoryToTransactionIds.get(categoryId) ?? []
    ids.push(uncategorized[index].id)
    categoryToTransactionIds.set(categoryId, ids)
  })

  let totalReclassified = 0
  for (const [categoryId, ids] of categoryToTransactionIds) {
    const count = await repo.transactionRepository.updateCategoryByIds(ids, categoryId)
    totalReclassified += count
  }

  logger.debug("CategorizeService: Reclassification complete", {
    reclassifiedCount: totalReclassified,
    userId,
  })

  return totalReclassified
}

/**
 * 削除されたルールで分類された取引を、残りのルールセットで再分類する
 * ルール削除時に呼び出し、誤分類を元に戻すために使用する
 */
export const reclassifyTransactionsByDeletedRule = async (
  userId: number,
  deletedRuleCategoryId: number,
  repo: ReclassifyRepo
): Promise<number> => {
  const affected = await repo.transactionRepository.findByUserIdAndCategoryId(userId, deletedRuleCategoryId)
  if (affected.length === 0) return 0

  logger.debug("CategorizeService: Reclassifying transactions after rule deletion", {
    categoryId: deletedRuleCategoryId,
    count: affected.length,
    userId,
  })

  const descriptions = affected.map((t) => t.description)
  const newCategoryIds = await categorizeManyDescriptions(
    userId,
    descriptions,
    {
      categoryRuleRepository: repo.categoryRuleRepository,
      userCategoryRuleRepository: repo.userCategoryRuleRepository,
    }
  )

  /** 元のカテゴリと異なる取引だけを更新する */
  const categoryToTransactionIds = new Map<number, number[]>()
  newCategoryIds.forEach((categoryId, index) => {
    if (categoryId === deletedRuleCategoryId) return
    const ids = categoryToTransactionIds.get(categoryId) ?? []
    ids.push(affected[index].id)
    categoryToTransactionIds.set(categoryId, ids)
  })

  let totalReclassified = 0
  for (const [categoryId, ids] of categoryToTransactionIds) {
    const count = await repo.transactionRepository.updateCategoryByIds(ids, categoryId)
    totalReclassified += count
  }

  logger.debug("CategorizeService: Reclassification after deletion complete", {
    reclassifiedCount: totalReclassified,
    userId,
  })

  return totalReclassified
}
