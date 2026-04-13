import { CategoryRuleRepository, UserCategoryRuleRepository } from "../repository/mysql"
import { convertFullWidthToHalfWidth } from "../utils/normalize"

const UNCATEGORIZED_ID = 99

/**
 * 説明文字列をカテゴリIDに分類する
 * ユーザールールを優先し、マッチしなければマスタールールを使用する
 */
export const categorizeDescription = async (
  userId: number,
  description: string,
  categoryRuleRepository: CategoryRuleRepository,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<number> => {
  const normalized = convertFullWidthToHalfWidth(description).toLowerCase()

  const userRules = await userCategoryRuleRepository.findByUserId(userId)
  for (const rule of userRules) {
    const keyword = convertFullWidthToHalfWidth(rule.keyword).toLowerCase()
    if (rule.matchType === "EXACT" && normalized === keyword) {
      return rule.categoryId
    }
    if (rule.matchType === "PARTIAL" && normalized.includes(keyword)) {
      return rule.categoryId
    }
  }

  const masterRules = await categoryRuleRepository.findAll()
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
  categoryRuleRepository: CategoryRuleRepository,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<number[]> => {
  const userRules = await userCategoryRuleRepository.findByUserId(userId)
  const masterRules = await categoryRuleRepository.findAll()

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
