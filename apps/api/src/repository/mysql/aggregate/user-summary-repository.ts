import { Prisma as PrismaTypes, PrismaClient } from "../../../prisma/generated/client"
import { UserWithCounts, UserWithDetail } from "../../../types/domain"

/**
 * ユーザー集約リポジトリのインターフェース
 */
export interface UserSummaryRepository {
  findAllWithCounts(): Promise<UserWithCounts[]>
  findByIdWithDetail(id: number): Promise<UserWithDetail | null>
}

/**
 * Prisma実装のユーザー集約リポジトリ
 */
export class PrismaUserSummaryRepository implements UserSummaryRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findAllWithCounts(): Promise<UserWithCounts[]> {
    const users = await this._prisma.user.findMany({
      include: {
        _count: {
          select: {
            csvUploads: true,
            transactions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return users.map((u) => this._toUserWithCounts(u))
  }

  async findByIdWithDetail(id: number): Promise<UserWithDetail | null> {
    const user = await this._prisma.user.findUnique({
      include: {
        _count: {
          select: {
            csvUploads: true,
            transactions: true,
          },
        },
        paymentSources: {
          select: { id: true, name: true, type: true },
        },
      },
      where: { id },
    })

    if (!user) return null

    return {
      ...this._toUserWithCounts(user),
      paymentSources: user.paymentSources.map((ps) => ({
        id: ps.id,
        name: ps.name,
        type: ps.type,
      })),
    }
  }

  /**
   * Prismaの型 → UserWithCounts に変換
   */
  private _toUserWithCounts(
    u: PrismaTypes.UserGetPayload<{ include: { _count: { select: { csvUploads: true; transactions: true } } } }>
  ): UserWithCounts {
    return {
      id: u.id,
      avatarUrl: u.avatarUrl,
      csvUploadCount: u._count.csvUploads,
      email: u.email,
      name: u.name,
      transactionCount: u._count.transactions,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }
  }
}
