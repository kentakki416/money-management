# Step5b: API - 取引・CSVアップロード Service・Controller・Router

step5a で作成した Repository を使って、自動分類・取引CRUD・CSVアップロード・支払い元の Service・Controller・Router を実装する。

## 対応内容

### 1. 自動カテゴリ分類 Service

`apps/api/src/service/categorize-service.ts` を作成:

- ユーザールール（`UserCategoryRuleRepository`）を先に照合
- マッチしなければマスタールール（`CategoryRuleRepository`）を照合
- どちらにもマッチしなければ「未分類」（ID: 99）
- `categorize(description, userId)` と `categorizeMany(descriptions, userId)` の2メソッド
- `convertFullWidthToHalfWidth` で全角→半角変換後にマッチング

### 2. 取引 Service

`apps/api/src/service/transaction-service.ts` を作成:

- `createManualTransaction`: カテゴリ未指定時は `categorize-service` で自動分類
- `updateTransaction`: カテゴリ変更時に `UserCategoryRuleRepository.upsertByKeyword` でユーザールールを自動作成
- `getTransactions`: フィルタ条件に基づいて取引一覧を取得
- `deleteTransaction`: 取引を削除

### 3. CSVアップロード Service

`apps/api/src/service/csv-upload-service.ts` を作成:

- ファイルハッシュ（SHA-256）で重複チェック
- `getCsvParser` で支払い元タイプに応じたパーサーを選択
- `categorizeMany` で一括自動分類（ユーザールール優先）
- 取引データを一括登録

### 4. 支払い元 Service

`apps/api/src/service/payment-source-service.ts` を作成。

### 5. Service の index.ts にエクスポート追加

```typescript
export * as categorize from "./categorize-service"
export * as csvUpload from "./csv-upload-service"
export * as paymentSource from "./payment-source-service"
export * as transaction from "./transaction-service"
```

### 6. Controller

既存の Controller パターン（Class + `execute(req, res)`）に従い、以下を作成:

- `apps/api/src/controller/transaction/` — `list.ts`, `create.ts`, `update.ts`, `delete.ts`
- `apps/api/src/controller/csv-upload/` — `upload.ts`, `list.ts`
- `apps/api/src/controller/payment-source/` — `list.ts`, `create.ts`, `delete.ts`

### 7. Router

既存の Router パターン（optional controllers オブジェクト）に従い、以下を作成:

- `apps/api/src/routes/transaction-router.ts`
- `apps/api/src/routes/csv-upload-router.ts`（multer ミドルウェア含む）
- `apps/api/src/routes/payment-source-router.ts`

### 8. index.ts にワイヤリング追加

Repository → Service → Controller → Router の順にインスタンス化して組み立てる。

## 動作確認

### curlによるAPI確認

```bash
# 支払い元作成
curl -X POST http://localhost:8080/api/payment-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"三井住友カード","type":"SMBC"}'

# CSVアップロード
curl -X POST http://localhost:8080/api/csv-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@data/smbc-202603.csv" \
  -F "payment_source_id=1" \
  -F "payment_source_type=SMBC"

# 取引一覧確認
curl "http://localhost:8080/api/transactions?year=2026&month=2" \
  -H "Authorization: Bearer <token>"

# 手動取引登録
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"description":"ランチ","amount":1200,"transaction_date":"2026-03-15","payment_source_id":1}'

# 重複CSVアップロード（409エラーを確認）
curl -X POST http://localhost:8080/api/csv-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@data/smbc-202603.csv" \
  -F "payment_source_id=1" \
  -F "payment_source_type=SMBC"
```
