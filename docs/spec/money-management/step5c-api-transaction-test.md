# Step5c: API - 取引・CSVアップロード テスト

自動分類・取引CRUD・CSVアップロード・支払い元の Service ユニットテストと Controller インテグレーションテストを実装する。

## 対応内容

### 1. 自動カテゴリ分類 Service テスト

`test/service/categorize-service/categorizeDescription.test.ts`:

- `CategoryRuleRepository` と `UserCategoryRuleRepository` をモック
- ユーザールールが先に照合されることを確認
- ユーザールールにマッチした場合はマスタールールが呼ばれないことを確認
- PARTIAL マッチ（includes）の動作確認
- EXACT マッチ（完全一致）の動作確認
- どちらにもマッチしない場合に 99（未分類）を返すことを確認
- 全角→半角変換後にマッチングされることを確認

`test/service/categorize-service/categorizeManyDescriptions.test.ts`:

- 複数の description に対して一括分類できることを確認
- ユーザールール優先の動作確認

### 2. 取引 Service テスト

`test/service/transaction-service/createManualTransaction.test.ts`:

- `TransactionRepository`, `CategoryRuleRepository`, `UserCategoryRuleRepository` をモック
- カテゴリ指定ありの場合はそのまま作成されることを確認
- カテゴリ未指定の場合は自動分類が呼ばれることを確認

`test/service/transaction-service/updateTransaction.test.ts`:

- カテゴリ変更時に `UserCategoryRuleRepository.upsertByKeyword` が呼ばれることを確認
- カテゴリ未変更時は upsert が呼ばれないことを確認

`test/service/transaction-service/getAllTransactions.test.ts`:

- フィルタ条件が正しくリポジトリに渡されることを確認

`test/service/transaction-service/deleteTransaction.test.ts`:

- 削除が正しく呼ばれることを確認

### 3. CSVアップロード Service テスト

`test/service/csv-upload-service/uploadCsv.test.ts`:

- `CsvUploadRepository`, `TransactionRepository`, `CategoryRuleRepository`, `UserCategoryRuleRepository` をモック
- 正常アップロード時にハッシュ計算・パース・分類・登録が順に行われることを確認
- 重複ハッシュの場合にエラーがスローされることを確認
- パース結果が0件の場合にエラーがスローされることを確認

`test/service/csv-upload-service/getUploadHistory.test.ts`:

- アップロード履歴一覧が返ることを確認

### 4. 支払い元 Service テスト

`test/service/payment-source-service/` に以下を作成:

- `getPaymentSources.test.ts`
- `createPaymentSource.test.ts`
- `deletePaymentSource.test.ts`

### 5. 取引 Controller テスト

既存の Controller テストパターン（テスト用DB + supertest）に従い、`test/controller/transaction/` に以下を作成:

- `list.test.ts` — 取引一覧取得（年月フィルタ、カテゴリフィルタ）
- `create.test.ts` — 手動取引登録（自動分類の動作確認含む）
- `update.test.ts` — 取引更新（カテゴリ変更時のユーザールール自動作成含む）
- `delete.test.ts` — 取引削除

テスト前に必要なマスターデータ（カテゴリ、分類ルール、支払い元）をseedする。

### 6. CSVアップロード Controller テスト

`test/controller/csv-upload/` に以下を作成:

- `upload.test.ts` — CSVファイルアップロード（`data/` の実ファイルを使用）、重複アップロード時の409確認
- `list.test.ts` — アップロード履歴一覧

### 7. 支払い元 Controller テスト

`test/controller/payment-source/` に以下を作成:

- `list.test.ts`
- `create.test.ts`
- `delete.test.ts`

## 動作確認

### テスト実行

```bash
cd apps/api

# 自動分類 Service テスト
pnpm test -- --testPathPatterns="categorize-service"

# 取引 Service テスト
pnpm test -- --testPathPatterns="transaction-service"

# CSVアップロード Service テスト
pnpm test -- --testPathPatterns="csv-upload-service"

# 支払い元 Service テスト
pnpm test -- --testPathPatterns="payment-source-service"

# Controller テスト（要DB起動）
pnpm test -- --testPathPatterns="controller/transaction"
pnpm test -- --testPathPatterns="controller/csv-upload"
pnpm test -- --testPathPatterns="controller/payment-source"
```

全テストがパスすることを確認する。
