# Step7g: Admin - ユーザー管理画面

登録ユーザーの一覧・詳細表示画面を実装する。TailAdmin DataTables（https://demo.tailadmin.com/data-tables）のパターンを参考にする。

## 対応内容

### 1. ページ・Server Action 作成

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

### 2. ツールバー（TailAdmin DataTables 準拠）

テーブル上部に以下を配置:

```tsx
{/* Show N entries */}
<div className="flex items-center gap-2">
  <span className="text-theme-sm text-gray-600 dark:text-gray-400">Show</span>
  <select ...>{/* 5, 10, 20 */}</select>
  <span className="text-theme-sm text-gray-600 dark:text-gray-400">entries</span>
</div>

{/* 検索 */}
<div className="relative">
  <input
    className="h-10 w-full rounded-lg border ... pl-10 ... sm:w-[300px]"
    placeholder="名前・メールで検索..."
  />
  {/* 虫眼鏡SVGアイコン（absolute配置） */}
</div>
```

### 3. テーブル

`BasicTableOne` パターンに準拠。

カラム構成:

| カラム | 内容 |
|-------|------|
| ID | `user.id` |
| ユーザー | 名前（`font-medium`）+ メール（`text-theme-xs`、2行表示） |
| 取引数 | `user.transaction_count.toLocaleString()` |
| CSV取込数 | `user.csv_upload_count` |
| 登録日 | `toLocaleDateString("ja-JP")` |
| Actions | 目アイコン（詳細表示） |

**Actions アイコン:**
- 詳細（目アイコン）: `text-gray-500 hover:text-gray-800 dark:hover:text-white/90`
- クリック時に `GET /api/admin/users/:id` で詳細取得 → モーダル表示

### 4. ページネーション

既存の `Pagination` コンポーネント（`components/ui/table/Pagination`）を使用。

```tsx
import Pagination from "@/components/ui/table/Pagination"

<div className="mt-5 flex flex-col items-center justify-between gap-4 xl:flex-row">
  <span className="text-theme-sm text-gray-500 dark:text-gray-400">
    Showing {startIndex} to {endIndex} of {total} entries
  </span>
  <Pagination
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={setCurrentPage}
  />
</div>
```

### 5. 検索・ページネーションロジック（クライアントサイド）

```typescript
/** 検索フィルタ */
const filteredUsers = useMemo(() => {
  if (!search) return users
  const lower = search.toLowerCase()
  return users.filter(
    (u) => u.name?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower)
  )
}, [users, search])

/** ページネーション */
const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage))
const paginatedUsers = useMemo(() => {
  const start = (currentPage - 1) * perPage
  return filteredUsers.slice(start, start + perPage)
}, [filteredUsers, currentPage, perPage])
```

### 6. ユーザー詳細モーダル

`Modal` コンポーネントを使用。表示内容:

- アバター画像（`next/image` の `Image` コンポーネント使用、`<img>` 禁止）またはイニシャル表示
- 名前・メール
- 取引数・CSV取込数（2カラムカード）
- 登録日
- 支払い元一覧（`payment_sources` をループ表示、タイプを `Badge` 的に表示）

### 7. エラー表示

`Alert` コンポーネントを使用（step7e 参照）。

### 8. 型定義

`@repo/api-schema` から以下をインポート:
- `AdminUser`, `GetAdminUserDetailResponse`, `GetAdminUserListResponse`

## 動作確認

1. `http://localhost:3030/users` にアクセス
2. ユーザー一覧テーブルが表示される
3. 「Show N entries」で件数切替できる
4. 名前・メールで検索できる
5. ページネーションが動作する
6. 目アイコンクリックでモーダルにユーザー詳細が表示される
