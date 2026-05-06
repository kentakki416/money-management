import { logger } from "../log"
import { CategoryRepository, CreateCateogryInput, UpdateCateogryInput } from "../repository/mysql"
import { Category } from "../types/domain"
import { err, notFoundError, ok, Result } from "../types/result"

type CategoryRepo = { categoryRepository: CategoryRepository }

/**
 * カテゴリ一覧を取得
 */
export const getAllCategories = async (
  repo: CategoryRepo
): Promise<Result<Category[]>> => {
  logger.debug("CategoryService: Fetching all categories")
  const categories = await repo.categoryRepository.findAll()
  logger.debug("CategoryService: Categories fetched", { count: categories.length })
  return ok(categories)
}

/**
 * カテゴリをIDで取得
 */
export const getCategoryById = async (
  id: number,
  repo: CategoryRepo
): Promise<Result<Category>> => {
  logger.debug("CategoryService: Fetching category by ID", { id })
  const category = await repo.categoryRepository.findById(id)
  if (!category) {
    logger.debug("CategoryService: Category not found", { id })
    return err(notFoundError("Category not found"))
  }
  return ok(category)
}

/**
 * カテゴリを作成
 */
export const createCategory = async (
  data: CreateCateogryInput,
  repo: CategoryRepo
): Promise<Result<Category>> => {
  logger.debug("CategoryService: Creating category", { name: data.name })
  const category = await repo.categoryRepository.create(data)
  logger.debug("CategoryService: Category created", { id: category.id })
  return ok(category)
}

/**
 * カテゴリを更新
 */
export const updateCategory = async (
  id: number,
  data: UpdateCateogryInput,
  repo: CategoryRepo
): Promise<Result<Category>> => {
  logger.debug("CategoryService: Updating category", { id })
  const existing = await repo.categoryRepository.findById(id)
  if (!existing) {
    logger.debug("CategoryService: Category not found for update", { id })
    return err(notFoundError("Category not found"))
  }
  const category = await repo.categoryRepository.update(id, data)
  logger.debug("CategoryService: Category updated", { id: category.id })
  return ok(category)
}

/**
 * カテゴリを削除
 */
export const deleteCategory = async (
  id: number,
  repo: CategoryRepo
): Promise<Result<{ deleted: true }>> => {
  logger.debug("CategoryService: Deleting category", { id })
  const existing = await repo.categoryRepository.findById(id)
  if (!existing) {
    logger.debug("CategoryService: Category not found for deletion", { id })
    return err(notFoundError("Category not found"))
  }
  await repo.categoryRepository.deleteById(id)
  logger.debug("CategoryService: Category deleted", { id })
  return ok({ deleted: true })
}
