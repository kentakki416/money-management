import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { UserCategoryRule } from "../../types/domain"

/**
 * ユーザールール作成時の入力
 */
export type CreateUserCategoryRuleInput = {
  categoryId: number
  keyword: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * ユーザールール更新時の入力
 */
export type UpdateUserCategoryRuleInput = {
  categoryId?: number
  keyword?: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * ユーザー個別分類ルールリポジトリのインターフェース
 */
export interface UserCategoryRuleRepository {
  create(userId: number, data: CreateUserCategoryRuleInput): Promise<UserCategoryRule>
  deleteById(id: number, userId: number): Promise<void>
  findByUserId(userId: number): Promise<UserCategoryRule[]>
  update(id: number, userId: number, data: UpdateUserCategoryRuleInput): Promise<UserCategoryRule>
  upsertByKeyword(userId: number, keyword: string, categoryId: number): Promise<UserCategoryRule>
}

type UserCategoryRuleWithCategory = PrismaTypes.UserCategoryRuleGetPayload<{
  include: { category: true }
}>

/**
 * Prisma実装のユーザー個別分類ルールリポジトリ
 */
export class PrismaUserCategoryRuleRepository implements UserCategoryRuleRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findByUserId(userId: number): Promise<UserCategoryRule[]> {
    const rules = await this._prisma.userCategoryRule.findMany({
      include: { category: true },
      orderBy: { priority: "desc" },
      where: { userId },
    })
    return rules.map((r) => this._toDomain(r))
  }

  async create(userId: number, data: CreateUserCategoryRuleInput): Promise<UserCategoryRule> {
    const rule = await this._prisma.userCategoryRule.create({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType ?? "PARTIAL",
        priority: data.priority ?? 0,
        userId,
      },
      include: { category: true },
    })
    return this._toDomain(rule)
  }

  async update(id: number, userId: number, data: UpdateUserCategoryRuleInput): Promise<UserCategoryRule> {
    const rule = await this._prisma.userCategoryRule.update({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType,
        priority: data.priority,
      },
      include: { category: true },
      where: { id, userId },
    })
    return this._toDomain(rule)
  }

  async deleteById(id: number, userId: number): Promise<void> {
    await this._prisma.userCategoryRule.deleteMany({ where: { id, userId } })
  }

  /**
   * 同じユーザー・同じキーワードのルールがあれば更新、なければ作成
   * 取引のカテゴリ手動変更時に自動呼び出しされる
   */
  async upsertByKeyword(userId: number, keyword: string, categoryId: number): Promise<UserCategoryRule> {
    const rule = await this._prisma.userCategoryRule.upsert({
      create: {
        categoryId,
        keyword,
        matchType: "PARTIAL",
        priority: 0,
        userId,
      },
      include: { category: true },
      update: {
        categoryId,
      },
      where: {
        userId_keyword: {
          keyword,
          userId,
        },
      },
    })
    return this._toDomain(rule)
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(rule: UserCategoryRuleWithCategory): UserCategoryRule {
    return {
      id: rule.id,
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      keyword: rule.keyword,
      matchType: rule.matchType as "PARTIAL" | "EXACT",
      priority: rule.priority,
      userId: rule.userId,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }
  }
}
