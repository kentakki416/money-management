import { Prisma, Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { RegistrationPeriod, User } from "../../types/domain"

/**
 * ユーザー作成時の入力
 */
export type CreateUserInput = {
  avatarUrl?: string
  email?: string
  name?: string
}

/**
 * ユーザーリポジトリのインターフェース
 */
export interface UserRepository {
  count(): Promise<number>
  countRegistrationsByPeriod(period: RegistrationPeriod): Promise<{ count: number; label: string }[]>
  create(data: CreateUserInput): Promise<User>
  findByEmail(email: string): Promise<User | null>
  findById(id: number): Promise<User | null>
}

/**
 * 期間ごとのSQLフォーマットとINTERVAL
 */
const PERIOD_CONFIG: Record<RegistrationPeriod, { format: string; interval: string }> = {
  daily: { format: "%H:00", interval: "INTERVAL 24 HOUR" },
  monthly: { format: "%m/%d", interval: "INTERVAL 1 MONTH" },
  weekly: { format: "%m/%d", interval: "INTERVAL 7 DAY" },
  yearly: { format: "%Y-%m", interval: "INTERVAL 12 MONTH" },
}

/**
 * Prisma実装のユーザーリポジトリ
 */
export class PrismaUserRepository implements UserRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async count(): Promise<number> {
    return this._prisma.user.count()
  }

  async countRegistrationsByPeriod(period: RegistrationPeriod): Promise<{ count: number; label: string }[]> {
    const config = PERIOD_CONFIG[period]

    const raw = await this._prisma.$queryRaw<{ count: bigint; label: string }[]>(
      Prisma.sql`SELECT DATE_FORMAT(created_at, ${config.format}) as label, COUNT(*) as count
       FROM users
       WHERE created_at >= DATE_SUB(NOW(), ${Prisma.raw(config.interval)})
       GROUP BY label
       ORDER BY MIN(created_at) ASC`
    )

    return raw.map((r) => ({
      count: Number(r.count),
      label: r.label,
    }))
  }

  async create(data: CreateUserInput): Promise<User> {
    const prismaUser = await this._prisma.user.create({
      data: {
        avatarUrl: data.avatarUrl,
        email: data.email,
        name: data.name,
      },
    })
    return this._toDomainUser(prismaUser)
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this._prisma.user.findUnique({ where: { email } })
    if (!prismaUser) return null
    return this._toDomainUser(prismaUser)
  }

  async findById(id: number): Promise<User | null> {
    const prismaUser = await this._prisma.user.findUnique({ where: { id } })
    if (!prismaUser) return null
    return this._toDomainUser(prismaUser)
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomainUser(prismaUser: PrismaTypes.UserGetPayload<{}>): User {
    return {
      avatarUrl: prismaUser.avatarUrl,
      createdAt: prismaUser.createdAt,
      email: prismaUser.email,
      id: prismaUser.id,
      name: prismaUser.name,
      updatedAt: prismaUser.updatedAt,
    }
  }
}
