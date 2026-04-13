# Step7a: API - Admin用スキーマ・リポジトリ・サービス

Admin画面が使用するAPIの基盤（スキーマ・リポジトリ・サービス・ダミーデータ）を実装する。

## 対応内容

### 1. スキーマ定義

`packages/schema/src/api-schema/admin.ts` を新規作成し、`index.ts` に `export * from "./admin"` を追加。

```typescript
import { z } from "zod"

/**
 * 登録推移の期間タイプ
 */
export const registrationPeriodSchema = z.enum(["yearly", "monthly", "weekly", "daily"])
export type RegistrationPeriod = z.infer<typeof registrationPeriodSchema>

/**
 * 管理画面ダッシュボード統計のレスポンススキーマ
 */
export const adminStatsResponseSchema = z.object({
  registrations: z.array(
    z.object({
      count: z.number(),
      label: z.string(),
    })
  ),
  total_csv_uploads: z.number(),
  total_users: z.number(),
})
export type AdminStatsResponse = z.infer<typeof adminStatsResponseSchema>

/**
 * 管理画面ユーザー情報スキーマ
 */
export const adminUserSchema = z.object({
  id: z.number(),
  avatar_url: z.string().nullable(),
  csv_upload_count: z.number(),
  email: z.string().nullable(),
  name: z.string().nullable(),
  transaction_count: z.number(),
  created_at: z.string(),
})
export type AdminUser = z.infer<typeof adminUserSchema>

/**
 * 管理画面ユーザー一覧のレスポンススキーマ
 */
export const getAdminUserListResponseSchema = z.object({
  total: z.number(),
  users: z.array(adminUserSchema),
})
export type GetAdminUserListResponse = z.infer<typeof getAdminUserListResponseSchema>

/**
 * 管理画面ユーザー詳細のレスポンススキーマ
 */
export const getAdminUserDetailResponseSchema = z.object({
  user: adminUserSchema.extend({
    payment_sources: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        type: z.string(),
      })
    ),
  }),
})
export type GetAdminUserDetailResponse = z.infer<typeof getAdminUserDetailResponseSchema>
```

### 2. リポジトリ

`apps/api/src/repository/mysql/admin-repository.ts` を新規作成し、`index.ts` に追加。

- `RegistrationPeriod` 型は `@repo/api-schema` からインポートする（ローカルに重複定義しない）
- 期間別SQLは `$queryRaw` + `Prisma.sql` / `Prisma.raw` を使い、`$queryRawUnsafe` は使わない（SQLインジェクション防止）

```typescript
import { RegistrationPeriod } from "@repo/api-schema"
import { Prisma, PrismaClient } from "../../prisma/generated/client"

export type AdminStats = {
  registrations: { count: number; label: string }[]
  totalCsvUploads: number
  totalUsers: number
}

export type AdminUserRow = { /* id, name, email, avatarUrl, csvUploadCount, transactionCount, createdAt */ }
export type AdminUserDetailRow = AdminUserRow & { paymentSources: { id: number; name: string; type: string }[] }

export interface AdminRepository {
  findUserById(id: number): Promise<AdminUserDetailRow | null>
  getAllUsers(): Promise<AdminUserRow[]>
  getStats(period: RegistrationPeriod): Promise<AdminStats>
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
```

- `getStats(period)`: `user.count()` + `csvUpload.count()` + 期間別集計クエリ
- `getAllUsers()`: `user.findMany` + `_count` で csvUploads / transactions を集計
- `findUserById(id)`: 上記 + `paymentSources` を include

### 3. サービス

`apps/api/src/service/admin-service.ts` を新規作成し、`service/index.ts` に `export * as admin from "./admin-service"` を追加。

- `getStats(period, repository)` / `getAllUsers(repository)` / `getUserDetail(id, repository)`
- ダミーデータは `src/service/__fixtures__/admin-fixtures.ts` に分離（サービスのロジックとダミーデータを混在させない）

### 4. カテゴリ・分類ルールのダミーデータ

`category-service.ts` と `category-rule-service.ts` にも `ADMIN_USE_DUMMY` 分岐を追加。ダミーデータは同様に `__fixtures__/` に分離。

### 5. 環境変数

`apps/api/.env.local` に追加:
```
ADMIN_USE_DUMMY=true
```

### 6. CORS設定

`apps/api/src/index.ts` で Admin アプリのオリジンも CORS 許可:
```typescript
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:3030"
app.use(cors({ credentials: true, origin: [FRONTEND_URL, ADMIN_URL] }))
```

### 7. PUBLIC_PATHS

`apps/api/src/const/index.ts` の `PUBLIC_PATHS` に `"/api/admin"` を追加。Admin API は認証なしでアクセス可能にする。

## 動作確認

```bash
cd packages/schema && pnpm build
cd apps/api && pnpm build
```
