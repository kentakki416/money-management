# Step7a: API - Admin用スキーマ・リポジトリ・サービス

Admin画面が使用するAPIの基盤（スキーマ・リポジトリ・サービス・ダミーデータ）を実装する。

## 対応内容

### 1. スキーマ定義

`packages/schema/src/api-schema/admin/` ディレクトリを新規作成し、APIごとにファイルを分割する。

Admin が使用するすべてのスキーマを `admin/` 配下に集約する。既存スキーマ（`category.ts` / `category-rule.ts`）と同じ構造の場合は共通スキーマを re-export して使い回す。Admin 固有のレスポンスが必要になった場合はこのディレクトリ内で拡張する。

```
packages/schema/src/api-schema/
  admin/
    index.ts            # バレルエクスポート
    stats.ts            # GET /api/admin/stats
    user.ts             # GET /api/admin/users, /api/admin/users/:id
    category.ts         # /api/admin/categories (CRUD) ※現時点は既存スキーマを re-export
    category-rule.ts    # /api/admin/category-rules (CRUD) ※現時点は既存スキーマを re-export
  category.ts           # 既存（アプリ向け共通スキーマ）
  category-rule.ts      # 既存（アプリ向け共通スキーマ）
  index.ts              # export * from "./admin" を追加
```

**`admin/stats.ts`:**

```typescript
import { z } from "zod"

// ========================================================
// 共通: 登録推移の期間タイプ
// ========================================================

/**
 * 登録推移の期間タイプ
 */
export const registrationPeriodSchema = z.enum(["yearly", "monthly", "weekly", "daily"])

export type RegistrationPeriod = z.infer<typeof registrationPeriodSchema>

// ========================================================
// GET /api/admin/stats - 管理画面ダッシュボード統計
// ========================================================

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
```

**`admin/user.ts`:**

```typescript
import { z } from "zod"

// ========================================================
// 共通: 管理画面ユーザー情報スキーマ
// ========================================================

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

// ========================================================
// GET /api/admin/users - 管理画面ユーザー一覧
// ========================================================

/**
 * 管理画面ユーザー一覧のレスポンススキーマ
 */
export const getAdminUserListResponseSchema = z.object({
  total: z.number(),
  users: z.array(adminUserSchema),
})

export type GetAdminUserListResponse = z.infer<typeof getAdminUserListResponseSchema>

// ========================================================
// GET /api/admin/users/:id - 管理画面ユーザー詳細
// ========================================================

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

**`admin/category.ts`:**

現時点では既存スキーマと同じ構造のため re-export する。Admin 固有のレスポンスが必要になった場合はここで新規定義する。

```typescript
// ========================================================
// /api/admin/categories - 管理画面カテゴリ管理
// 現時点は既存スキーマと同一のため re-export
// Admin 固有のレスポンスが必要になった場合はここで定義する
// ========================================================

export {
  categorySchema,
  createCategoryRequestSchema,
  createCategoryResponse,
  getCategoryListResponseSchema,
  updateCategoryRequestSchema,
  updateCategoryResponseSchema,
} from "../category"

export type {
  Category,
  CreateCategoryReponse,
  CreateCategoryRequest,
  GetCategoryListResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from "../category"
```

**`admin/category-rule.ts`:**

```typescript
// ========================================================
// /api/admin/category-rules - 管理画面分類ルール管理
// 現時点は既存スキーマと同一のため re-export
// Admin 固有のレスポンスが必要になった場合はここで定義する
// ========================================================

export {
  categoryRuleSchema,
  createCategoryRuleRequestSchema,
  createCategoryRuleResponseSchema,
  deleteCategoryRuleResponseSchema,
  getCategoryRuleListResponseSchema,
  updateCategoryRuleRequestSchema,
  updateCategoryRuleResponseSchema,
} from "../category-rule"

export type {
  CategoryRule,
  CreateCategoryRuleRequest,
  CreateCategoryRuleResponse,
  DeleteCategoryRuleResponse,
  GetCategoryRuleListResponse,
  UpdateCategoryRuleRequest,
  UpdateCategoryRuleResponse,
} from "../category-rule"
```

**`admin/index.ts`:**

```typescript
export * from "./category"
export * from "./category-rule"
export * from "./stats"
export * from "./user"
```

**設計方針:**
- Admin が使用するスキーマはすべて `admin/` 配下からインポートする
- Admin フロントエンドでは `@repo/api-schema` の `admin/` 経由でインポートすること
- 現時点で既存スキーマと同一の場合は re-export で対応し、Admin 固有のフィールド追加やレスポンス変更が必要になった時点でこのファイル内に新規定義する

### 2. ドメイン型の追加

**`types/domain/registration-period.ts` を新規作成:**

```typescript
export type RegistrationPeriod = "yearly" | "monthly" | "weekly" | "daily"
```

`types/domain/index.ts` にバレルエクスポートを追加。

リポジトリ・サービスではこのドメイン型を使用する。`@repo/api-schema` の Zod enum（`registrationPeriodSchema`）は同じ値で独立して定義し、API バリデーション用として使う。

### 3. リポジトリの拡張

`AdminRepository` は作成しない。以下の方針で既存リポジトリを拡張する:

| 層 | 役割 | 配置場所 |
|---|------|---------|
| 単一テーブル操作 | count、集計クエリ等 | `repository/mysql/{feature}-repository.ts` |
| 複数テーブルの集約 | User + リレーション（_count, paymentSources 等） | `repository/mysql/aggregate/` |
| ビジネスロジック | リポジトリの組み合わせ | `service/` |

**`user-repository.ts` に追加するメソッド（単一テーブル操作）:**

```typescript
import { RegistrationPeriod } from "../../types/domain"

export interface UserRepository {
  // ... 既存メソッド（create, findByEmail, findById）
  count(): Promise<number>
  countRegistrationsByPeriod(period: RegistrationPeriod): Promise<{ count: number; label: string }[]>
}
```

- `count()`: `prisma.user.count()`
- `countRegistrationsByPeriod(period)`: 期間別の登録推移を集計。`$queryRaw` + `Prisma.sql` を使用（`$queryRawUnsafe` は使わない）

**`csv-upload-repository.ts` に追加するメソッド（単一テーブル操作）:**

```typescript
export interface CsvUploadRepository {
  // ... 既存メソッド（create, existsByHash, findByUserId）
  count(): Promise<number>
}
```

**`aggregate/user-summary-repository.ts` を新規作成（複数テーブルの集約）:**

```typescript
import { User } from "../../../types/domain"

export type UserWithCounts = User & {
  csvUploadCount: number
  transactionCount: number
}

export type UserWithDetail = UserWithCounts & {
  paymentSources: { id: number; name: string; type: string }[]
}

export interface UserSummaryRepository {
  findAllWithCounts(): Promise<UserWithCounts[]>
  findByIdWithDetail(id: number): Promise<UserWithDetail | null>
}
```

- `findAllWithCounts()`: `prisma.user.findMany` + `include: { _count: { select: { csvUploads, transactions } } }`
- `findByIdWithDetail(id)`: 上記 + `paymentSources` を include

`repository/mysql/index.ts` にバレルエクスポートを追加。

### 4. サービス

`apps/api/src/service/admin-service.ts` を新規作成し、`service/index.ts` に `export * as admin from "./admin-service"` を追加。

リポジトリを組み合わせて Admin 画面用のデータを構築する。service 層はリポジトリの関数を呼ぶだけでドメインロジックに集中できる:

```typescript
import { RegistrationPeriod } from "../types/domain"
import { CsvUploadRepository, UserRepository, UserSummaryRepository } from "../repository/mysql"

export const getStats = async (
  period: RegistrationPeriod,
  userRepository: UserRepository,
  csvUploadRepository: CsvUploadRepository
) => {
  const [totalUsers, totalCsvUploads, registrations] = await Promise.all([
    userRepository.count(),
    csvUploadRepository.count(),
    userRepository.countRegistrationsByPeriod(period),
  ])
  return { registrations, totalCsvUploads, totalUsers }
}

export const getAllUsers = async (userSummaryRepository: UserSummaryRepository) => {
  return userSummaryRepository.findAllWithCounts()
}

export const getUserDetail = async (id: number, userSummaryRepository: UserSummaryRepository) => {
  return userSummaryRepository.findByIdWithDetail(id)
}
```

ダミーデータは `src/service/__fixtures__/admin-fixtures.ts` に分離（サービスのロジックとダミーデータを混在させない）。

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
