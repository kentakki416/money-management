import { Prisma as PrismaTypes, PrismaClient } from "@/prisma/generated/client"
import { Category } from "@/types/domain"

/**
 * カテゴリー作成時の入力
 */
export type CreateCateogryInput = {
  color: string
  name: string
  sortOrder?: number
}

/**
 * カテゴリー更新時の入力
 */
export type UpdateCateogryInput = {
  color?: string
  name?: string
  sortOrder?: number
}

/**
 * カテゴリーリポジトリのインタフェース
 */
export interface CategoryRepository {}

/**
 * Prismaの実装カテゴリーリポジトリ
 */
export class PrismaCategoryRepository implements CategoryRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findAll(): Promise<Category[]> {
    const categories = await this._prisma.category.findMany({
      orderBy: { sortOrder: "asc" }
    })
    return categories.map((c) => this._toDomain(c))
  }

  async findById(id: number): Promise<Category | null> {
    const category = await this._prisma.category.findUnique({ where: { id: id } })
    if (!category) return null
    return this._toDomain(category)
  }

  async create(data: CreateCateogryInput): Promise<Category> {
    const category = await this._prisma.category.create({
      data: {
        color: data.color,
        name: data.name,
        sortOrder: data.sortOrder ?? 0
      }
    })
    return this._toDomain(category)
  }

  async update(id: number, data: UpdateCateogryInput): Promise<Category> {
    const category = await this._prisma.category.update({
      data: {
        color: data.color,
        name: data.name,
        sortOrder: data.sortOrder
      },
      where: { id }
    })
    return this._toDomain(category)
  }

  async deleteById(id: number): Promise<void> {
    await this._prisma.category.delete({ where: { id: id } })
  }

  /**
   * Prisma型 -> ドメイン型に変換
   */
  private _toDomain(prismaCategory: PrismaTypes.CategoryGetPayload<{}>): Category {
    return {
      id: prismaCategory.id,
      color: prismaCategory.color,
      name: prismaCategory.name,
      sortOrder: prismaCategory.sortOrder,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt
    }
  }
}