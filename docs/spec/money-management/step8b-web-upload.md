# Step8b: Web - CSVアップロード画面

CSVファイルのアップロードとアップロード履歴表示画面を実装する。

## 対応内容

### 1. ページ（Server Component）

`apps/web/src/app/(dashboard)/upload/page.tsx` を新規作成。

Server Component として初期データ（支払い元一覧、アップロード履歴）をサーバー間通信で取得し、Client Component に props で渡す。

```tsx
import type { GetCsvUploadListResponse, GetPaymentSourceListResponse } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

export const dynamic = "force-dynamic"

export default async function UploadPage() {
  const [sourcesData, historyData] = await Promise.all([
    apiClient.get<GetPaymentSourceListResponse>("/api/payment-sources"),
    apiClient.get<GetCsvUploadListResponse>("/api/csv-uploads"),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">CSVアップロード</h1>
      <CsvUploadForm paymentSources={sourcesData.payment_sources} />
      <UploadHistory initialHistory={historyData.csv_uploads} />
    </div>
  )
}
```

### 2. Route Handler（CSVアップロード用）

`apps/web/src/app/api/csv-uploads/route.ts` を新規作成。

CSVアップロードは FormData を扱うため Route Handler を使用する（Server Action ではなく）。

```typescript
import { NextRequest, NextResponse } from "next/server"

import { apiClient } from "@/libs/api-client"

export const POST = async (request: NextRequest) => {
  const formData = await request.formData()
  const result = await apiClient.upload("/api/csv-uploads", formData)
  return NextResponse.json(result)
}
```

アップロード履歴の再取得用:

```typescript
export const GET = async () => {
  const data = await apiClient.get("/api/csv-uploads")
  return NextResponse.json(data)
}
```

### 3. アップロードフォーム（Client Component）

`apps/web/src/components/features/upload/CsvUploadForm.tsx` を新規作成。

```tsx
"use client"

import type { PaymentSource } from "@repo/api-schema"

interface CsvUploadFormProps {
  paymentSources: PaymentSource[]
}
```

- 支払い元を props で受け取る（初期データは Server Component が取得済み）
- ファイル選択 + 支払い元選択 → Route Handler (`/api/csv-uploads`) に POST
- アップロード結果（成功/エラー）を表示
- アップロード成功後、`router.refresh()` で Server Component のデータを再取得

| 操作 | 方式 | API パス |
|------|------|---------|
| 支払い元一覧 | Server Component（props） | `GET /api/payment-sources` |
| CSVアップロード | Route Handler | `POST /api/csv-uploads` |

### 4. アップロード履歴テーブル（Client Component）

`apps/web/src/components/features/upload/UploadHistory.tsx` を新規作成。

```tsx
"use client"

import type { CsvUpload } from "@repo/api-schema"

interface UploadHistoryProps {
  initialHistory: CsvUpload[]
}
```

テーブルカラム:

| カラム | 内容 |
|-------|------|
| ファイル名 | `upload.file_name` |
| 支払い元 | `upload.payment_source_name` |
| 取込件数 | `upload.row_count` |
| アップロード日時 | `upload.uploaded_at`（`toLocaleString("ja-JP")`） |

### 5. 型定義

`@repo/api-schema` から以下をインポート:
- `CsvUpload`, `CsvUploadResponse`, `GetCsvUploadListResponse`, `GetPaymentSourceListResponse`, `PaymentSource`

## 動作確認

```bash
cd apps/web && pnpm build
```

1. `http://localhost:3000/upload` にアクセス
2. 支払い元のドロップダウンにデータが表示される（MANUAL以外）
3. CSVファイルを選択してアップロードが正常に動作する
4. アップロード成功メッセージと取込件数が表示される
5. アップロード履歴テーブルに履歴が表示される
