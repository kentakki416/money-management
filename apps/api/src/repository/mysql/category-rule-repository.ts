import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { CategoryRule } from "../../types/domain"

/**
 * カテゴリルール作成時の入力
 */
export type CreateCategoryRuleInput = {
  categoryId: number
  keyword: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * カテゴリルール更新時の入力
 */
export type UpdateCategoryRuleInput = {
  categoryId?: number
  keyword?: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * カテゴリルールリポジトリのインターフェース
 */
export interface CategoryRuleRepository {
  create(data: CreateCategoryRuleInput): Promise<CategoryRule>
  deleteById(id: number): Promise<void>
  findAll(): Promise<CategoryRule[]>
  update(id: number, data: UpdateCategoryRuleInput): Promise<CategoryRule>
}

type CategoryRuleWithCategory = PrismaTypes.CategoryRuleGetPayload<{
  include: { category: true }
}>

/**
 * Prisma実装のカテゴリルールリポジトリ
 */
export class PrismaCategoryRuleRepository implements CategoryRuleRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findAll(): Promise<CategoryRule[]> {
    const rules = await this._prisma.categoryRule.findMany({
      include: { category: true },
      orderBy: { priority: "desc" },
    })
    return rules.map((r) => this._toDomain(r))
  }

  async create(data: CreateCategoryRuleInput): Promise<CategoryRule> {
    const rule = await this._prisma.categoryRule.create({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType ?? "PARTIAL",
        priority: data.priority ?? 0,
      },
      include: { category: true },
    })
    return this._toDomain(rule)
  }

  async update(id: number, data: UpdateCategoryRuleInput): Promise<CategoryRule> {
    const rule = await this._prisma.categoryRule.update({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType,
        priority: data.priority,
      },
      include: { category: true },
      where: { id },
    })
    return this._toDomain(rule)
  }

  async deleteById(id: number): Promise<void> {
    await this._prisma.categoryRule.delete({ where: { id } })
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(rule: CategoryRuleWithCategory): CategoryRule {
    return {
      id: rule.id,
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      keyword: rule.keyword,
      matchType: rule.matchType as "PARTIAL" | "EXACT",
      priority: rule.priority,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }
  }
}
