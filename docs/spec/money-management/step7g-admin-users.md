# Step7g: Admin - ユーザー管理画面

登録ユーザーの一覧・詳細表示画面を実装する。

## 対応内容

### 1. ページ・Route Handler 作成

**ページ:** `apps/admin/src/app/(dashboard)/users/page.tsx`（Server Component）
- `apiClient.get` でユーザー一覧を取得し、Client Component に props で渡す

**Route Handler:** `apps/admin/src/app/api/admin/users/[id]/route.ts`
- Client Component から詳細モーダル表示時にデータ取得するための Route Handler
- データ取得（GET）のため Server Action ではなく Route Handler を使用

```typescript
import { NextRequest, NextResponse } from "next/server"

import { apiClient } from "@/libs/api-client"

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const user = await apiClient.get(`/api/admin/users/${id}`)
  return NextResponse.json(user)
}
```

**API パス:**

| 操作 | 方式 | API パス |
|------|------|---------|
| ユーザー一覧取得 | Server Component | `GET /api/admin/users` |
| ユーザー詳細取得 | Route Handler | `GET /api/admin/users/:id` |

### 2. テーブル

`DataTable` コンポーネントを使用。検索とページネーションを有効にする。

カラム定義:

```typescript
const columns: Column<AdminUser>[] = [
  { header: "ID", key: "id" },
  {
    header: "ユーザー",
    render: (user) => (
      <div>
        <div className="font-medium text-gray-800 dark:text-white/90">{user.name ?? "-"}</div>
        <div className="text-theme-xs text-gray-500">{user.email ?? "-"}</div>
      </div>
    ),
  },
  {
    header: "取引数",
    render: (user) => user.transaction_count.toLocaleString(),
  },
  { header: "CSV取込数", key: "csv_upload_count" },
  {
    header: "登録日",
    render: (user) => new Date(user.created_at).toLocaleDateString("ja-JP"),
  },
  {
    header: "Actions",
    render: (user) => (/* 目アイコン → 詳細モーダル */),
  },
]

<DataTable
  columns={columns}
  data={users}
  getRowKey={(user) => user.id}
  pagination={{ pageSizeOptions: [5, 10, 20] }}
  search={{ filterKeys: ["name", "email"], placeholder: "名前・メールで検索..." }}
/>
```

### 3. ユーザー詳細モーダル

`Modal` コンポーネントを使用。目アイコンクリック時に Route Handler (`/api/admin/users/:id`) で詳細取得。

表示内容:
- アバター画像（`next/image` の `Image` コンポーネント使用）またはイニシャル表示
- 名前・メール
- 取引数・CSV取込数（2カラムカード）
- 登録日
- 支払い元一覧（`payment_sources` をループ表示、タイプを `Badge` で表示）

### 4. エラー表示

`Alert` コンポーネントを使用。

### 5. 型定義

`@repo/api-schema` から以下をインポート:
- `AdminUser`, `GetAdminUserDetailResponse`, `GetAdminUserListResponse`

## 動作確認

1. `http://localhost:3030/users` にアクセス
2. ユーザー一覧テーブルが表示される
3. 「Show N entries」で件数切替できる
4. 名前・メールで検索できる
5. ページネーションが動作する
6. 目アイコンクリックでモーダルにユーザー詳細が表示される
