# Step7b: API - Admin用コントローラー・ルーター

Admin画面が使用するAPIエンドポイントを実装する。すべてのAdmin APIは `/api/admin/` 配下に統合する。

## 対応内容

### 1. コントローラー

`apps/api/src/controller/admin/` ディレクトリに以下を作成:

**stats.ts** - `AdminStatsController`

```typescript
import { Request, Response } from "express"

import { ErrorResponse, RegistrationPeriod, adminStatsResponseSchema, registrationPeriodSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CsvUploadRepository, UserRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面ダッシュボード統計API
 */
export class AdminStatsController {
  constructor(
    private userRepository: UserRepository,
    private csvUploadRepository: CsvUploadRepository
  ) {}

  async execute(req: Request, res: Response) {
    try {
      const periodParam = req.query.period as string | undefined
      const parsed = registrationPeriodSchema.safeParse(periodParam)
      const period: RegistrationPeriod = parsed.success ? parsed.data : "yearly"

      const stats = await service.admin.getStats(period, this.userRepository, this.csvUploadRepository)

      const response = adminStatsResponseSchema.parse({
        registrations: stats.registrations,
        total_csv_uploads: stats.totalCsvUploads,
        total_users: stats.totalUsers,
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "AdminStatsController: Failed to get admin stats",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get admin stats",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
```

**user-list.ts** - `AdminUserListController`
- `GET /api/admin/users`
- constructor で `UserSummaryRepository` を受け取る
- `service.admin.getAllUsers(userSummaryRepository)` を呼び出し
- camelCase → snake_case のマッピングを行い `getAdminUserListResponseSchema.parse()` でレスポンスを検証

**user-detail.ts** - `AdminUserDetailController`
- `GET /api/admin/users/:id`
- constructor で `UserSummaryRepository` を受け取る
- パスパラメータ `id` を Number 変換、NaN チェック → 400
- ユーザー未存在 → 404
- camelCase → snake_case のマッピングを行い `getAdminUserDetailResponseSchema.parse()` でレスポンスを検証

### 2. ルーター

`apps/api/src/routes/admin-router.ts` にすべてのAdmin APIルートを統合。カテゴリ・分類ルールも含め、admin-router 1つで管理する。

```typescript
type AdminRouterControllers = {
  categoryCreate?: AdminCategoryCreateController
  categoryDelete?: AdminCategoryDeleteController
  categoryList?: AdminCategoryListController
  categoryRuleCreate?: AdminCategoryRuleCreateController
  categoryRuleDelete?: AdminCategoryRuleDeleteController
  categoryRuleList?: AdminCategoryRuleListController
  categoryRuleUpdate?: AdminCategoryRuleUpdateController
  categoryUpdate?: AdminCategoryUpdateController
  stats?: AdminStatsController
  userDetail?: AdminUserDetailController
  userList?: AdminUserListController
}
```

すべて `controller/admin/` 配下の Admin 専用コントローラーを使用する。

ルート一覧:

| メソッド | パス | コントローラー |
|---------|------|--------------|
| GET | `/stats` | stats |
| GET | `/users` | userList |
| GET | `/users/:id` | userDetail |
| GET | `/categories` | categoryList |
| POST | `/categories` | categoryCreate |
| PUT | `/categories/:id` | categoryUpdate |
| DELETE | `/categories/:id` | categoryDelete |
| GET | `/category-rules` | categoryRuleList |
| POST | `/category-rules` | categoryRuleCreate |
| PUT | `/category-rules/:id` | categoryRuleUpdate |
| DELETE | `/category-rules/:id` | categoryRuleDelete |

### 3. index.ts 修正

- `admin-router` にカテゴリ・分類ルールのコントローラーも渡す
- 旧 `categoryRouter` / `categoryRuleRouter` の個別 `app.use()` 登録を削除
- 旧ルーターの import を削除

### 4. 設計方針

- **Controller は API ごとに1ファイル新規作成する**（`controller/admin/` 配下）
- api-schema と同様に、Admin とアプリケーション側ではリクエスト・レスポンスが今後異なるため、最初から分離しておく
- Service は共通のものを使う（Controller がスキーマの import 先と camelCase/snake_case マッピングを担当）
- 現時点では既存 Controller と同じ実装だが、Admin 固有のバリデーションやレスポンス変更が必要になった時点でこのファイルだけ修正すればよい
- 旧 `category-router.ts` / `category-rule-router.ts` ファイルはアプリケーション向けに残す

### 5. controller/admin/ のファイル構成

```
controller/admin/
  stats.ts              # GET /api/admin/stats
  user-list.ts          # GET /api/admin/users
  user-detail.ts        # GET /api/admin/users/:id
  category-list.ts      # GET /api/admin/categories
  category-create.ts    # POST /api/admin/categories
  category-update.ts    # PUT /api/admin/categories/:id
  category-delete.ts    # DELETE /api/admin/categories/:id
  category-rule-list.ts    # GET /api/admin/category-rules
  category-rule-create.ts  # POST /api/admin/category-rules
  category-rule-update.ts  # PUT /api/admin/category-rules/:id
  category-rule-delete.ts  # DELETE /api/admin/category-rules/:id
```

## 動作確認

```bash
cd apps/api && pnpm build
# サーバー起動後
curl http://localhost:8080/api/admin/stats
curl http://localhost:8080/api/admin/users
curl http://localhost:8080/api/admin/categories
curl http://localhost:8080/api/admin/category-rules
```
