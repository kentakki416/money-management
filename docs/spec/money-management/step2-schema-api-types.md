# Step2: Schema パッケージ（Zod スキーマ定義）

`packages/schema/src/api-schema/` に家計簿機能用のZodスキーマを追加する。

## 対応内容

### 1. カテゴリスキーマ

`packages/schema/src/api-schema/category.ts` を作成:

```typescript
import { z } from "zod"

// ========================================================
// カテゴリ共通スキーマ
// ========================================================

/**
 * カテゴリスキーマ
 */
export const categorySchema = z.object({
  color: z.string(),
  created_at: z.string(),
  id: z.number(),
  name: z.string(),
  sort_order: z.number(),
  updated_at: z.string(),
})

export type Category = z.infer<typeof categorySchema>

// ========================================================
// GET /api/categories - カテゴリ一覧取得
// ========================================================

/**
 * カテゴリ一覧取得のレスポンススキーマ
 */
export const getCategoryListResponseSchema = z.object({
  categories: z.array(categorySchema),
})

export type GetCategoryListResponse = z.infer<typeof getCategoryListResponseSchema>

// ========================================================
// POST /api/categories - カテゴリ作成
// ========================================================

/**
 * カテゴリ作成のリクエストスキーマ
 */
export const createCategoryRequestSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  name: z.string().min(1).max(50),
  sort_order: z.number().int().min(0).optional(),
})

export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>

/**
 * カテゴリ作成のレスポンススキーマ
 */
export const createCategoryResponseSchema = z.object({
  category: categorySchema,
})

export type CreateCategoryResponse = z.infer<typeof createCategoryResponseSchema>

// ========================================================
// PUT /api/categories/:id - カテゴリ更新
// ========================================================

/**
 * カテゴリ更新のリクエストスキーマ
 */
export const updateCategoryRequestSchema = z.object({
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  name: z.string().min(1).max(50).optional(),
  sort_order: z.number().int().min(0).optional(),
})

export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>

/**
 * カテゴリ更新のレスポンススキーマ
 */
export const updateCategoryResponseSchema = z.object({
  category: categorySchema,
})

export type UpdateCategoryResponse = z.infer<typeof updateCategoryResponseSchema>

// ========================================================
// DELETE /api/categories/:id - カテゴリ削除
// ========================================================

/**
 * カテゴリ削除のリクエストスキーマ
 */
export const deleteCategoryRequestSchema = z.object({
  id: z.coerce.number().int(),
})

export type DeleteCategoryRequest = z.infer<typeof deleteCategoryRequestSchema>

/**
 * カテゴリ削除のレスポンススキーマ
 */
export const deleteCategoryResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteCategoryResponse = z.infer<typeof deleteCategoryResponseSchema>
```

### 2. 自動分類ルールスキーマ

`packages/schema/src/api-schema/category-rule.ts` を作成:

```typescript
import { z } from "zod"

// ========================================================
// 自動分類ルール共通スキーマ
// ========================================================

/**
 * マッチタイプスキーマ
 */
export const matchTypeSchema = z.enum(["PARTIAL", "EXACT"])

export type MatchType = z.infer<typeof matchTypeSchema>

/**
 * 自動分類ルールスキーマ（マスター）
 */
export const categoryRuleSchema = z.object({
  category_id: z.number(),
  category_name: z.string().optional(),
  created_at: z.string(),
  id: z.number(),
  keyword: z.string(),
  match_type: matchTypeSchema,
  priority: z.number(),
  updated_at: z.string(),
})

export type CategoryRule = z.infer<typeof categoryRuleSchema>

// ========================================================
// GET /api/category-rules - 自動分類ルール一覧取得
// ========================================================

/**
 * 自動分類ルール一覧取得のレスポンススキーマ
 */
export const getCategoryRuleListResponseSchema = z.object({
  rules: z.array(categoryRuleSchema),
})

export type GetCategoryRuleListResponse = z.infer<typeof getCategoryRuleListResponseSchema>

// ========================================================
// POST /api/category-rules - 自動分類ルール作成
// ========================================================

/**
 * 自動分類ルール作成のリクエストスキーマ
 */
export const createCategoryRuleRequestSchema = z.object({
  category_id: z.number().int(),
  keyword: z.string().min(1).max(200),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type CreateCategoryRuleRequest = z.infer<typeof createCategoryRuleRequestSchema>

/**
 * 自動分類ルール作成のレスポンススキーマ
 */
export const createCategoryRuleResponseSchema = z.object({
  rule: categoryRuleSchema,
})

export type CreateCategoryRuleResponse = z.infer<typeof createCategoryRuleResponseSchema>

// ========================================================
// PUT /api/category-rules/:id - 自動分類ルール更新
// ========================================================

/**
 * 自動分類ルール更新のリクエストスキーマ
 */
export const updateCategoryRuleRequestSchema = z.object({
  category_id: z.number().int().optional(),
  keyword: z.string().min(1).max(200).optional(),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type UpdateCategoryRuleRequest = z.infer<typeof updateCategoryRuleRequestSchema>

/**
 * 自動分類ルール更新のレスポンススキーマ
 */
export const updateCategoryRuleResponseSchema = z.object({
  rule: categoryRuleSchema,
})

export type UpdateCategoryRuleResponse = z.infer<typeof updateCategoryRuleResponseSchema>

// ========================================================
// DELETE /api/category-rules/:id - 自動分類ルール削除
// ========================================================

/**
 * 自動分類ルール削除のリクエストスキーマ
 */
export const deleteCategoryRuleRequestSchema = z.object({
  id: z.coerce.number().int(),
})

export type DeleteCategoryRuleRequest = z.infer<typeof deleteCategoryRuleRequestSchema>

/**
 * 自動分類ルール削除のレスポンススキーマ
 */
export const deleteCategoryRuleResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteCategoryRuleResponse = z.infer<typeof deleteCategoryRuleResponseSchema>
```

### 3. 支払い元スキーマ

`packages/schema/src/api-schema/payment-source.ts` を作成:

```typescript
import { z } from "zod"

// ========================================================
// 支払い元共通スキーマ
// ========================================================

/**
 * 支払い元タイプスキーマ
 */
export const paymentSourceTypeSchema = z.enum(["SMBC", "MUFG", "PAYPAY", "MANUAL"])

export type PaymentSourceType = z.infer<typeof paymentSourceTypeSchema>

/**
 * 支払い元スキーマ
 */
export const paymentSourceSchema = z.object({
  created_at: z.string(),
  id: z.number(),
  name: z.string(),
  type: paymentSourceTypeSchema,
  user_id: z.number(),
})

export type PaymentSource = z.infer<typeof paymentSourceSchema>

// ========================================================
// GET /api/payment-sources - 支払い元一覧取得
// ========================================================

/**
 * 支払い元一覧取得のレスポンススキーマ
 */
export const getPaymentSourceListResponseSchema = z.object({
  payment_sources: z.array(paymentSourceSchema),
})

export type GetPaymentSourceListResponse = z.infer<typeof getPaymentSourceListResponseSchema>

// ========================================================
// POST /api/payment-sources - 支払い元作成
// ========================================================

/**
 * 支払い元作成のリクエストスキーマ
 */
export const createPaymentSourceRequestSchema = z.object({
  name: z.string().min(1).max(100),
  type: paymentSourceTypeSchema,
})

export type CreatePaymentSourceRequest = z.infer<typeof createPaymentSourceRequestSchema>

/**
 * 支払い元作成のレスポンススキーマ
 */
export const createPaymentSourceResponseSchema = z.object({
  payment_source: paymentSourceSchema,
})

export type CreatePaymentSourceResponse = z.infer<typeof createPaymentSourceResponseSchema>

// ========================================================
// DELETE /api/payment-sources/:id - 支払い元削除
// ========================================================

/**
 * 支払い元削除のリクエストスキーマ
 */
export const deletePaymentSourceRequestSchema = z.object({
  id: z.coerce.number().int(),
})

export type DeletePaymentSourceRequest = z.infer<typeof deletePaymentSourceRequestSchema>

/**
 * 支払い元削除のレスポンススキーマ
 */
export const deletePaymentSourceResponseSchema = z.object({
  success: z.boolean(),
})

export type DeletePaymentSourceResponse = z.infer<typeof deletePaymentSourceResponseSchema>
```

### 4. 取引スキーマ

`packages/schema/src/api-schema/transaction.ts` を作成:

```typescript
import { z } from "zod"

// ========================================================
// 取引共通スキーマ
// ========================================================

/**
 * 取引スキーマ
 */
export const transactionSchema = z.object({
  amount: z.number(),
  category_id: z.number().nullable(),
  category_name: z.string().nullable().optional(),
  category_color: z.string().nullable().optional(),
  created_at: z.string(),
  csv_upload_id: z.number().nullable(),
  description: z.string(),
  id: z.number(),
  is_manual: z.boolean(),
  payment_source_id: z.number(),
  payment_source_name: z.string().optional(),
  transaction_date: z.string(),
  updated_at: z.string(),
  user_id: z.number(),
})

export type Transaction = z.infer<typeof transactionSchema>

// ========================================================
// GET /api/transactions - 取引一覧取得（フィルタ付き）
// ========================================================

/**
 * 取引一覧取得のリクエストスキーマ
 */
export const getTransactionListRequestSchema = z.object({
  category_id: z.coerce.number().int().optional(),
  date: z.string().optional(), // YYYY-MM-DD（特定日）
  month: z.coerce.number().int().min(1).max(12).optional(),
  payment_source_id: z.coerce.number().int().optional(),
  year: z.coerce.number().int().optional(),
})

export type GetTransactionListRequest = z.infer<typeof getTransactionListRequestSchema>

/**
 * 取引一覧取得のレスポンススキーマ
 */
export const getTransactionListResponseSchema = z.object({
  total_amount: z.number(),
  transactions: z.array(transactionSchema),
})

export type GetTransactionListResponse = z.infer<typeof getTransactionListResponseSchema>

// ========================================================
// POST /api/transactions - 取引手動作成
// ========================================================

/**
 * 取引手動作成のリクエストスキーマ
 */
export const createTransactionRequestSchema = z.object({
  amount: z.number().int().min(1),
  category_id: z.number().int().optional(),
  description: z.string().min(1).max(500),
  payment_source_id: z.number().int(),
  transaction_date: z.string(), // YYYY-MM-DD
})

export type CreateTransactionRequest = z.infer<typeof createTransactionRequestSchema>

/**
 * 取引手動作成のレスポンススキーマ
 */
export const createTransactionResponseSchema = z.object({
  transaction: transactionSchema,
})

export type CreateTransactionResponse = z.infer<typeof createTransactionResponseSchema>

// ========================================================
// PUT /api/transactions/:id - 取引更新
// ========================================================

/**
 * 取引更新のリクエストスキーマ
 */
export const updateTransactionRequestSchema = z.object({
  amount: z.number().int().min(1).optional(),
  category_id: z.number().int().nullable().optional(),
  description: z.string().min(1).max(500).optional(),
  transaction_date: z.string().optional(),
})

export type UpdateTransactionRequest = z.infer<typeof updateTransactionRequestSchema>

/**
 * 取引更新のレスポンススキーマ
 */
export const updateTransactionResponseSchema = z.object({
  transaction: transactionSchema,
})

export type UpdateTransactionResponse = z.infer<typeof updateTransactionResponseSchema>

// ========================================================
// DELETE /api/transactions/:id - 取引削除
// ========================================================

/**
 * 取引削除のリクエストスキーマ
 */
export const deleteTransactionRequestSchema = z.object({
  id: z.coerce.number().int(),
})

export type DeleteTransactionRequest = z.infer<typeof deleteTransactionRequestSchema>

/**
 * 取引削除のレスポンススキーマ
 */
export const deleteTransactionResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteTransactionResponse = z.infer<typeof deleteTransactionResponseSchema>
```

### 5. CSVアップロードスキーマ

`packages/schema/src/api-schema/csv-upload.ts` を作成:

```typescript
import { z } from "zod"

// ========================================================
// CSVアップロード共通スキーマ
// ========================================================

/**
 * CSVアップロードスキーマ
 */
export const csvUploadSchema = z.object({
  file_hash: z.string(),
  file_name: z.string(),
  id: z.number(),
  payment_source_id: z.number(),
  payment_source_name: z.string().optional(),
  row_count: z.number(),
  uploaded_at: z.string(),
  user_id: z.number(),
})

export type CsvUpload = z.infer<typeof csvUploadSchema>

// ========================================================
// POST /api/csv-uploads - CSVアップロード
// ========================================================

/**
 * CSVアップロードのレスポンススキーマ
 */
export const csvUploadResponseSchema = z.object({
  csv_upload: csvUploadSchema,
  imported_count: z.number(),
})

export type CsvUploadResponse = z.infer<typeof csvUploadResponseSchema>

// ========================================================
// GET /api/csv-uploads - CSVアップロード履歴一覧取得
// ========================================================

/**
 * CSVアップロード履歴一覧取得のレスポンススキーマ
 */
export const getCsvUploadListResponseSchema = z.object({
  csv_uploads: z.array(csvUploadSchema),
})

export type GetCsvUploadListResponse = z.infer<typeof getCsvUploadListResponseSchema>
```

### 6. 集計スキーマ

`packages/schema/src/api-schema/summary.ts` を作成:

```typescript
import { z } from "zod"

// ========================================================
// GET /api/summary/monthly - 月間カテゴリ別集計
// ========================================================

/**
 * 月間集計のリクエストスキーマ
 */
export const monthlySummaryRequestSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
})

export type MonthlySummaryRequest = z.infer<typeof monthlySummaryRequestSchema>

/**
 * カテゴリ別集計スキーマ
 */
export const categorySummarySchema = z.object({
  amount: z.number(),
  category_color: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  percentage: z.number(),
})

export type CategorySummary = z.infer<typeof categorySummarySchema>

/**
 * 月間集計のレスポンススキーマ
 */
export const monthlySummaryResponseSchema = z.object({
  categories: z.array(categorySummarySchema),
  month: z.number(),
  total_amount: z.number(),
  year: z.number(),
})

export type MonthlySummaryResponse = z.infer<typeof monthlySummaryResponseSchema>

// ========================================================
// GET /api/summary/calendar - カレンダー用日別集計
// ========================================================

/**
 * カレンダー集計のリクエストスキーマ
 */
export const calendarSummaryRequestSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int(),
})

export type CalendarSummaryRequest = z.infer<typeof calendarSummaryRequestSchema>

/**
 * 日別集計スキーマ
 */
export const dailySummarySchema = z.object({
  amount: z.number(),
  date: z.string(), // YYYY-MM-DD
  transaction_count: z.number(),
})

export type DailySummary = z.infer<typeof dailySummarySchema>

/**
 * カレンダー集計のレスポンススキーマ
 */
export const calendarSummaryResponseSchema = z.object({
  days: z.array(dailySummarySchema),
  month: z.number(),
  total_amount: z.number(),
  year: z.number(),
})

export type CalendarSummaryResponse = z.infer<typeof calendarSummaryResponseSchema>

// ========================================================
// GET /api/summary/trend - 月次推移（折れ線グラフ用）
// ========================================================

/**
 * 月次推移のリクエストスキーマ
 */
export const trendRequestSchema = z.object({
  months: z.coerce.number().int().min(1).max(24).optional(),
})

export type TrendRequest = z.infer<typeof trendRequestSchema>

/**
 * 月次推移ポイントスキーマ
 */
export const monthlyTrendPointSchema = z.object({
  amount: z.number(),
  month: z.number(),
  year: z.number(),
})

export type MonthlyTrendPoint = z.infer<typeof monthlyTrendPointSchema>

/**
 * カテゴリ別月次推移スキーマ
 */
export const categoryTrendSchema = z.object({
  category_color: z.string(),
  category_id: z.number(),
  category_name: z.string(),
  data: z.array(monthlyTrendPointSchema),
})

export type CategoryTrend = z.infer<typeof categoryTrendSchema>

/**
 * 月次推移のレスポンススキーマ
 */
export const trendResponseSchema = z.object({
  categories: z.array(categoryTrendSchema),
  months: z.array(z.object({
    month: z.number(),
    year: z.number(),
  })),
  total: z.array(monthlyTrendPointSchema),
})

export type TrendResponse = z.infer<typeof trendResponseSchema>
```

### 7. ユーザー個別分類ルールスキーマ

`packages/schema/src/api-schema/user-category-rule.ts` を作成:

```typescript
import { z } from "zod"

import { matchTypeSchema } from "./category-rule"

// ========================================================
// ユーザー個別分類ルール共通スキーマ
// ========================================================

/**
 * ユーザー個別分類ルールスキーマ
 */
export const userCategoryRuleSchema = z.object({
  category_id: z.number(),
  category_name: z.string().optional(),
  created_at: z.string(),
  id: z.number(),
  keyword: z.string(),
  match_type: matchTypeSchema,
  priority: z.number(),
  updated_at: z.string(),
  user_id: z.number(),
})

export type UserCategoryRule = z.infer<typeof userCategoryRuleSchema>

// ========================================================
// GET /api/user-category-rules - ユーザールール一覧取得
// ========================================================

/**
 * ユーザールール一覧取得のレスポンススキーマ
 */
export const getUserCategoryRuleListResponseSchema = z.object({
  rules: z.array(userCategoryRuleSchema),
})

export type GetUserCategoryRuleListResponse = z.infer<typeof getUserCategoryRuleListResponseSchema>

// ========================================================
// POST /api/user-category-rules - ユーザールール作成
// ========================================================

/**
 * ユーザールール作成のリクエストスキーマ
 */
export const createUserCategoryRuleRequestSchema = z.object({
  category_id: z.number().int(),
  keyword: z.string().min(1).max(200),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type CreateUserCategoryRuleRequest = z.infer<typeof createUserCategoryRuleRequestSchema>

/**
 * ユーザールール作成のレスポンススキーマ
 */
export const createUserCategoryRuleResponseSchema = z.object({
  rule: userCategoryRuleSchema,
})

export type CreateUserCategoryRuleResponse = z.infer<typeof createUserCategoryRuleResponseSchema>

// ========================================================
// PUT /api/user-category-rules/:id - ユーザールール更新
// ========================================================

/**
 * ユーザールール更新のリクエストスキーマ
 */
export const updateUserCategoryRuleRequestSchema = z.object({
  category_id: z.number().int().optional(),
  keyword: z.string().min(1).max(200).optional(),
  match_type: matchTypeSchema.optional(),
  priority: z.number().int().min(0).optional(),
})

export type UpdateUserCategoryRuleRequest = z.infer<typeof updateUserCategoryRuleRequestSchema>

/**
 * ユーザールール更新のレスポンススキーマ
 */
export const updateUserCategoryRuleResponseSchema = z.object({
  rule: userCategoryRuleSchema,
})

export type UpdateUserCategoryRuleResponse = z.infer<typeof updateUserCategoryRuleResponseSchema>

// ========================================================
// DELETE /api/user-category-rules/:id - ユーザールール削除
// ========================================================

/**
 * ユーザールール削除のレスポンススキーマ
 */
export const deleteUserCategoryRuleResponseSchema = z.object({
  success: z.boolean(),
})

export type DeleteUserCategoryRuleResponse = z.infer<typeof deleteUserCategoryRuleResponseSchema>
```

### 8. index.ts にエクスポート追加

`packages/schema/src/api-schema/index.ts` に追加:

```typescript
// 既存のエクスポート
export * from "./auth"
export * from "./health"
export * from "./memo"
export * from "./user"

// 家計簿機能のエクスポート
export * from "./category"
export * from "./category-rule"
export * from "./csv-upload"
export * from "./payment-source"
export * from "./summary"
export * from "./transaction"
export * from "./user-category-rule"
```

## 動作確認

### ビルド確認

```bash
cd packages/schema
pnpm build
```

エラーなくビルドが完了することを確認する。

### 型推論確認

各スキーマからTypeScript型が正しく推論されることを確認:

```typescript
import { CreateTransactionRequest, MonthlySummaryResponse } from "@repo/api-schema"

// 型推論のテスト（IDE上で型が表示されること）
const req: CreateTransactionRequest = {
  amount: 1000,
  description: "テスト",
  payment_source_id: 1,
  transaction_date: "2026-03-15",
}
```
