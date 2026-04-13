# Step5a: API - 取引・CSVアップロード Repository

取引データと CSVアップロードのドメイン型定義と Repository を実装する。

## 対応内容

### 1. ドメイン型定義

step4a で作成済みの `ParsedTransaction`（`types/domain/transaction.ts`）に加え、以下を追加する。

`apps/api/src/types/domain/transaction.ts` に追加:

```typescript
export type Transaction = {
  id: number
  amount: number
  categoryColor: string | null
  categoryId: number | null
  categoryName: string | null
  csvUploadId: number | null
  description: string
  isManual: boolean
  paymentSourceId: number
  paymentSourceName: string
  transactionDate: Date
  userId: number
  createdAt: Date
  updatedAt: Date
}
```

`apps/api/src/types/domain/csv-upload.ts` を作成:

```typescript
export type CsvUpload = {
  id: number
  fileHash: string
  fileName: string
  paymentSourceId: number
  paymentSourceName: string
  rowCount: number
  uploadedAt: Date
  userId: number
}
```

`apps/api/src/types/domain/index.ts` にエクスポート追加:

```typescript
export type { CsvUpload } from "./csv-upload"
export type { ParsedTransaction, Transaction } from "./transaction"
```

### 2. 取引 Repository

`apps/api/src/repository/mysql/transaction-repository.ts` を作成。

既存の memo-repository.ts と同一パターンで実装する:
- `TransactionRepository` インターフェース（`findByFilter`, `create`, `createMany`, `update`, `deleteById`）
- `PrismaTransactionRepository` クラス
- `TransactionFilter` 型（userId, year, month, date, categoryId でフィルタ）
- `CreateTransactionInput` 型
- `_toDomain()` で category, paymentSource のリレーションを含む変換

### 3. CSVアップロード Repository

`apps/api/src/repository/mysql/csv-upload-repository.ts` を作成。

- `CsvUploadRepository` インターフェース（`create`, `existsByHash`, `findByUserId`）
- `PrismaCsvUploadRepository` クラス
- `_toDomain()` で paymentSource のリレーションを含む変換

### 4. 支払い元 Repository

`apps/api/src/repository/mysql/payment-source-repository.ts` を作成。

- `PaymentSourceRepository` インターフェース（`create`, `deleteById`, `findByUserId`）
- `PrismaPaymentSourceRepository` クラス

### 5. Repository の index.ts にエクスポート追加

```typescript
export * from "./csv-upload-repository"
export * from "./payment-source-repository"
export * from "./transaction-repository"
```

## 動作確認

### ビルド確認

```bash
cd apps/api
pnpm build
```

エラーなくビルドが完了することを確認する。
