import { logger } from "../log"
import { CategoryRuleRepository, CreateCategoryRuleInput, UpdateCategoryRuleInput } from "../repository/mysql"
import { CategoryRule } from "../types/domain"
import { ok, Result } from "../types/result"

type CategoryRuleRepo = { categoryRuleRepository: CategoryRuleRepository }

/**
 * マスタールール一覧を取得
 */
export const getAllCategoryRules = async (
  repo: CategoryRuleRepo
): Promise<Result<CategoryRule[]>> => {
  logger.debug("CategoryRuleService: Fetching all category rules")
  const rules = await repo.categoryRuleRepository.findAll()
  logger.debug("CategoryRuleService: Rules fetched", { count: rules.length })
  return ok(rules)
}

/**
 * マスタールールを作成
 */
export const createCategoryRule = async (
  data: CreateCategoryRuleInput,
  repo: CategoryRuleRepo
): Promise<Result<CategoryRule>> => {
  logger.debug("CategoryRuleService: Creating rule", { keyword: data.keyword })
  const rule = await repo.categoryRuleRepository.create(data)
  logger.debug("CategoryRuleService: Rule created", { id: rule.id })
  return ok(rule)
}

/**
 * マスタールールを更新
 */
export const updateCategoryRule = async (
  id: number,
  data: UpdateCategoryRuleInput,
  repo: CategoryRuleRepo
): Promise<Result<CategoryRule>> => {
  logger.debug("CategoryRuleService: Updating rule", { id })
  const rule = await repo.categoryRuleRepository.update(id, data)
  logger.debug("CategoryRuleService: Rule updated", { id: rule.id })
  return ok(rule)
}

/**
 * マスタールールを削除
 */
export const deleteCategoryRule = async (
  id: number,
  repo: CategoryRuleRepo
): Promise<Result<{ deleted: true }>> => {
  logger.debug("CategoryRuleService: Deleting rule", { id })
  await repo.categoryRuleRepository.deleteById(id)
  logger.debug("CategoryRuleService: Rule deleted", { id })
  return ok({ deleted: true })
}
