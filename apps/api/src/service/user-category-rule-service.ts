import { logger } from "../log"
import { CreateUserCategoryRuleInput, UpdateUserCategoryRuleInput, UserCategoryRuleRepository } from "../repository/mysql"
import { UserCategoryRule } from "../types/domain"

/**
 * ユーザールール一覧を取得
 */
export const getUserCategoryRules = async (
  userId: number,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule[]> => {
  logger.debug("UserCategoryRuleService: Fetching user rules", { userId })
  const rules = await userCategoryRuleRepository.findByUserId(userId)
  logger.debug("UserCategoryRuleService: Rules fetched", { count: rules.length, userId })
  return rules
}

/**
 * ユーザールールを作成
 */
export const createUserCategoryRule = async (
  userId: number,
  data: CreateUserCategoryRuleInput,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule> => {
  logger.debug("UserCategoryRuleService: Creating user rule", { keyword: data.keyword, userId })
  const rule = await userCategoryRuleRepository.create(userId, data)
  logger.debug("UserCategoryRuleService: User rule created", { id: rule.id })
  return rule
}

/**
 * ユーザールールを更新
 */
export const updateUserCategoryRule = async (
  id: number,
  userId: number,
  data: UpdateUserCategoryRuleInput,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule> => {
  logger.debug("UserCategoryRuleService: Updating user rule", { id, userId })
  const rule = await userCategoryRuleRepository.update(id, userId, data)
  logger.debug("UserCategoryRuleService: User rule updated", { id: rule.id })
  return rule
}

/**
 * ユーザールールを削除
 */
export const deleteUserCategoryRule = async (
  id: number,
  userId: number,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<void> => {
  logger.debug("UserCategoryRuleService: Deleting user rule", { id, userId })
  await userCategoryRuleRepository.deleteById(id, userId)
  logger.debug("UserCategoryRuleService: User rule deleted", { id })
}

/**
 * ユーザールールの upsert（取引カテゴリ変更時に自動呼び出し）
 */
export const upsertUserCategoryRuleByKeyword = async (
  userId: number,
  keyword: string,
  categoryId: number,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule> => {
  logger.debug("UserCategoryRuleService: Upserting user rule", { categoryId, keyword, userId })
  const rule = await userCategoryRuleRepository.upsertByKeyword(userId, keyword, categoryId)
  logger.debug("UserCategoryRuleService: User rule upserted", { id: rule.id })
  return rule
}
