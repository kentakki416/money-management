import { logger } from "../log"
import { CategoryRepository, CreateCateogryInput, UpdateCateogryInput } from "../repository/mysql"
import { Category } from "../types/domain"

/**
 * カテゴリ一覧を取得
 */
export const getAllCategories = async (
  categoryRepository: CategoryRepository
): Promise<Category[]> => {
  logger.debug("CategoryService: Fetching all categories")
  const categories = await categoryRepository.findAll()
  logger.debug("CategoryService: Categories fetched", { count: categories.length })
  return categories
}

/**
 * カテゴリをIDで取得
 */
export const getCategoryById = async (
  id: number,
  categoryRepository: CategoryRepository
): Promise<Category | null> => {
  logger.debug("CategoryService: Fetching category by ID", { id })
  const category = await categoryRepository.findById(id)
  if (!category) {
    logger.debug("CategoryService: Category not found", { id })
  }
  return category
}

/**
 * カテゴリを作成
 */
export const createCategory = async (
  data: CreateCateogryInput,
  categoryRepository: CategoryRepository
): Promise<Category> => {
  logger.debug("CategoryService: Creating category", { name: data.name })
  const category = await categoryRepository.create(data)
  logger.debug("CategoryService: Category created", { id: category.id })
  return category
}

/**
 * カテゴリを更新
 */
export const updateCategory = async (
  id: number,
  data: UpdateCateogryInput,
  categoryRepository: CategoryRepository
): Promise<Category | null> => {
  logger.debug("CategoryService: Updating category", { id })
  const existing = await categoryRepository.findById(id)
  if (!existing) {
    logger.debug("CategoryService: Category not found for update", { id })
    return null
  }
  const category = await categoryRepository.update(id, data)
  logger.debug("CategoryService: Category updated", { id: category.id })
  return category
}

/**
 * カテゴリを削除
 */
export const deleteCategory = async (
  id: number,
  categoryRepository: CategoryRepository
): Promise<boolean> => {
  logger.debug("CategoryService: Deleting category", { id })
  const existing = await categoryRepository.findById(id)
  if (!existing) {
    logger.debug("CategoryService: Category not found for deletion", { id })
    return false
  }
  await categoryRepository.deleteById(id)
  logger.debug("CategoryService: Category deleted", { id })
  return true
}
