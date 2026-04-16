import { Prisma as PrismaTypes, PaymentSourceType, PrismaClient } from "../../prisma/generated/client"
import { PaymentSource } from "../../types/domain"

/**
 * 支払い元作成時の入力
 */
export type CreatePaymentSourceInput = {
  userId: number
  name: string
  type: string
}

/**
 * 支払い元リポジトリのインターフェース
 */
export interface PaymentSourceRepository {
  create(data: CreatePaymentSourceInput): Promise<PaymentSource>
  deleteById(id: number): Promise<void>
  findByUserId(userId: number): Promise<PaymentSource[]>
}

/**
 * Prisma実装の支払い元リポジトリ
 */
export class PrismaPaymentSourceRepository implements PaymentSourceRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async create(data: CreatePaymentSourceInput): Promise<PaymentSource> {
    const paymentSource = await this._prisma.paymentSource.create({
      data: {
        name: data.name,
        type: data.type as PaymentSourceType,
        userId: data.userId,
      },
    })
    return this._toDomain(paymentSource)
  }

  async deleteById(id: number): Promise<void> {
    await this._prisma.paymentSource.delete({ where: { id } })
  }

  async findByUserId(userId: number): Promise<PaymentSource[]> {
    const paymentSources = await this._prisma.paymentSource.findMany({
      orderBy: { createdAt: "asc" },
      where: { userId },
    })
    return paymentSources.map((p) => this._toDomain(p))
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(p: PrismaTypes.PaymentSourceGetPayload<{}>): PaymentSource {
    return {
      color: p.color,
      id: p.id,
      name: p.name,
      type: p.type,
      userId: p.userId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }
  }
}
