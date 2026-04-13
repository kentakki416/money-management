# Step7b: API - Admin用コントローラー・ルーター

Admin画面が使用するAPIエンドポイントを実装する。すべてのAdmin APIは `/api/admin/` 配下に統合する。

## 対応内容

### 1. コントローラー

`apps/api/src/controller/admin/` ディレクトリに以下を作成:

**stats.ts** - `AdminStatsController`
- `GET /api/admin/stats?period=yearly|monthly|weekly|daily`
- クエリパラメータ `period` を `registrationPeriodSchema` でバリデーション（デフォルト: `yearly`）
- `service.admin.getStats(period, repository)` を呼び出し
- `adminStatsResponseSchema.parse()` でレスポンスを検証

**user-list.ts** - `AdminUserListController`
- `GET /api/admin/users`
- `service.admin.getAllUsers(repository)` を呼び出し
- `getAdminUserListResponseSchema.parse()` でレスポンスを検証

**user-detail.ts** - `AdminUserDetailController`
- `GET /api/admin/users/:id`
- パスパラメータ `id` を Number 変換、NaN チェック
- 404 ハンドリング

### 2. ルーター

`apps/api/src/routes/admin-router.ts` にすべてのAdmin APIルートを統合。カテゴリ・分類ルールも含め、admin-router 1つで管理する。

```typescript
type AdminRouterControllers = {
  categoryCreate?: CategoryCreateController
  categoryDelete?: CategoryDeleteController
  categoryList?: CategoryListController
  categoryRuleCreate?: CategoryRuleCreateController
  categoryRuleDelete?: CategoryRuleDeleteController
  categoryRuleList?: CategoryRuleListController
  categoryRuleUpdate?: CategoryRuleUpdateController
  categoryUpdate?: CategoryUpdateController
  stats?: AdminStatsController
  userDetail?: AdminUserDetailController
  userList?: AdminUserListController
}
```

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

### 4. 注意事項

- カテゴリ・分類ルールの Controller / Service は既存のものをそのまま使う（共通）
- パスだけが `/api/categories` → `/api/admin/categories` に変わる
- 旧 `category-router.ts` / `category-rule-router.ts` ファイルは残しても削除してもよい（Admin以外で使う場合に備え残す）

## 動作確認

```bash
cd apps/api && pnpm build
# サーバー起動後
curl http://localhost:8080/api/admin/stats
curl http://localhost:8080/api/admin/users
curl http://localhost:8080/api/admin/categories
curl http://localhost:8080/api/admin/category-rules
```
