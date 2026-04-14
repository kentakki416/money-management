import { User } from "./user"

/**
 * ユーザー集計情報（User + リレーションの件数）
 */
export type UserWithCounts = User & {
  csvUploadCount: number
  transactionCount: number
}

/**
 * ユーザー詳細情報（集計 + 支払い元）
 */
export type UserWithDetail = UserWithCounts & {
  paymentSources: { id: number; name: string; type: string }[]
}
