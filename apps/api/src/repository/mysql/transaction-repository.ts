import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { Transaction } from "../../types/domain"

/**
 * 取引フィルタ条件
 */
export type TransactionFilter = {
  userId: number
  year?: number
  month?: number
  date?: string
  categoryId?: number
  paymentSourceId?: number
}

/**
 * 取引作成時の入力
 */
export type CreateTransactionInput = {
  userId: number
  paymentSourceId: number
  categoryId?: number
  csvUploadId?: number
  transactionDate: Date
  description: string
  amount: number
  isManual: boolean
}

/**
 * 取引更新時の入力
 */
export type UpdateTransactionInput = {
  amount?: number
  categoryId?: number | null
  description?: string
  transactionDate?: Date
}

/**
 * 取引リポジトリのインターフェース
 */
export interface TransactionRepository {
  findByFilter(filter: TransactionFilter): Promise<Transaction[]>
  create(data: CreateTransactionInput): Promise<Transaction>
  createMany(data: CreateTransactionInput[]): Promise<Transaction[]>
  update(id: number, data: UpdateTransactionInput): Promise<Transaction>
  deleteById(id: number): Promise<void>
}

type TransactionWithRelations = PrismaTypes.TransactionGetPayload<{
  include: { category: true; paymentSource: true }
}>

/**
 * Prisma実装の取引リポジトリ
 */
export class PrismaTransactionRepository implements TransactionRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findByFilter(filter: TransactionFilter): Promise<Transaction[]> {
    const where: PrismaTypes.TransactionWhereInput = {
      userId: filter.userId,
    }

    if (filter.date) {
      const d = new Date(filter.date)
      const nextDay = new Date(d)
      nextDay.setDate(nextDay.getDate() + 1)
      where.transactionDate = { gte: d, lt: nextDay }
    } else if (filter.year !== undefined && filter.month !== undefined) {
      const start = new Date(filter.year, filter.month - 1, 1)
      const end = new Date(filter.year, filter.month, 1)
      where.transactionDate = { gte: start, lt: end }
    } else if (filter.year !== undefined) {
      const start = new Date(filter.year, 0, 1)
      const end = new Date(filter.year + 1, 0, 1)
      where.transactionDate = { gte: start, lt: end }
    }

    if (filter.categoryId !== undefined) {
      where.categoryId = filter.categoryId
    }

    if (filter.paymentSourceId !== undefined) {
      where.paymentSourceId = filter.paymentSourceId
    }

    const transactions = await this._prisma.transaction.findMany({
      include: { category: true, paymentSource: true },
      orderBy: { transactionDate: "desc" },
      where,
    })

    return transactions.map((t) => this._toDomain(t))
  }

  async create(data: CreateTransactionInput): Promise<Transaction> {
    const transaction = await this._prisma.transaction.create({
      data: {
        amount: data.amount,
        categoryId: data.categoryId,
        csvUploadId: data.csvUploadId,
        description: data.description,
        isManual: data.isManual,
        paymentSourceId: data.paymentSourceId,
        transactionDate: data.transactionDate,
        userId: data.userId,
      },
      include: { category: true, paymentSource: true },
    })
    return this._toDomain(transaction)
  }

  async createMany(data: CreateTransactionInput[]): Promise<Transaction[]> {
    const transactions = await Promise.all(data.map(async (item) => this.create(item)))
    return transactions
  }

  async update(id: number, data: UpdateTransactionInput): Promise<Transaction> {
    const transaction = await this._prisma.transaction.update({
      data: {
        amount: data.amount,
        categoryId: data.categoryId,
        description: data.description,
        transactionDate: data.transactionDate,
      },
      include: { category: true, paymentSource: true },
      where: { id },
    })
    return this._toDomain(transaction)
  }

  async deleteById(id: number): Promise<void> {
    await this._prisma.transaction.delete({ where: { id } })
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(t: TransactionWithRelations): Transaction {
    return {
      id: t.id,
      amount: t.amount,
      categoryColor: t.category?.color ?? null,
      categoryId: t.categoryId,
      categoryName: t.category?.name ?? null,
      csvUploadId: t.csvUploadId,
      description: t.description,
      isManual: t.isManual,
      paymentSourceId: t.paymentSourceId,
      paymentSourceName: t.paymentSource.name,
      transactionDate: t.transactionDate,
      userId: t.userId,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }
  }
}
