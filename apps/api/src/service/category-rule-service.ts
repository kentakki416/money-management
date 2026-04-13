import { logger } from "../log"
import { CategoryRuleRepository, CreateCategoryRuleInput, UpdateCategoryRuleInput } from "../repository/mysql"
import { CategoryRule } from "../types/domain"

/**
 * マスタールール一覧を取得
 */
export const getAllCategoryRules = async (
  categoryRuleRepository: CategoryRuleRepository
): Promise<CategoryRule[]> => {
  logger.debug("CategoryRuleService: Fetching all category rules")
  const rules = await categoryRuleRepository.findAll()
  logger.debug("CategoryRuleService: Rules fetched", { count: rules.length })
  return rules
}

/**
 * マスタールールを作成
 */
export const createCategoryRule = async (
  data: CreateCategoryRuleInput,
  categoryRuleRepository: CategoryRuleRepository
): Promise<CategoryRule> => {
  logger.debug("CategoryRuleService: Creating rule", { keyword: data.keyword })
  const rule = await categoryRuleRepository.create(data)
  logger.debug("CategoryRuleService: Rule created", { id: rule.id })
  return rule
}

/**
 * マスタールールを更新
 */
export const updateCategoryRule = async (
  id: number,
  data: UpdateCategoryRuleInput,
  categoryRuleRepository: CategoryRuleRepository
): Promise<CategoryRule> => {
  logger.debug("CategoryRuleService: Updating rule", { id })
  const rule = await categoryRuleRepository.update(id, data)
  logger.debug("CategoryRuleService: Rule updated", { id: rule.id })
  return rule
}

/**
 * マスタールールを削除
 */
export const deleteCategoryRule = async (
  id: number,
  categoryRuleRepository: CategoryRuleRepository
): Promise<void> => {
  logger.debug("CategoryRuleService: Deleting rule", { id })
  await categoryRuleRepository.deleteById(id)
  logger.debug("CategoryRuleService: Rule deleted", { id })
}
