# Step7c: Admin - 共通部品（API通信基盤・サイドバー・共有コンポーネント）

Admin画面の共通基盤を実装する。

## 対応内容

### 1. API 通信基盤

ブラウザから Express API を直接 fetch しない。Server Components / Server Actions を経由してサーバー間通信する。

```
[初期表示] Server Component → Express API（サーバー間通信、CORS不要）
[CRUD操作] Client Component → Server Action → Express API（サーバー間通信）
```

**`apps/admin/src/libs/api-client.ts`（サーバーサイド専用）を新規作成:**

Server Components と Server Actions から使うサーバーサイド用の fetch ラッパー。`"use server"` の Server Action や Server Component 内でのみ使用する。`NEXT_PUBLIC_` プレフィックスは不要（ブラウザに公開しない）。

```typescript
const API_BASE_URL = process.env.API_URL || "http://localhost:8080"

export const apiClient = {
  delete: async <T = unknown>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  put: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },
}
```

- `credentials: "include"` は不要（サーバー間通信のため Cookie は送らない）
- 認証が必要になった場合はサーバー側でトークンをヘッダーに付与する

### 2. サイドバー修正

`apps/admin/src/components/layout/AppSidebar.tsx` の `navItems` を修正:

- `UserIcon` を import に追加
- Dashboard を subItems なしの直リンク（`path: "/"`）に変更
- 「マスター管理」セクションを追加（カテゴリ管理 `/categories`、分類ルール管理 `/category-rules`）
- 「ユーザー」メニューを追加（`path: "/users"`）

```typescript
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <ListIcon />,
    name: "マスター管理",
    subItems: [
      { name: "カテゴリ管理", path: "/categories", pro: false },
      { name: "分類ルール管理", path: "/category-rules", pro: false },
    ],
  },
  {
    icon: <UserIcon />,
    name: "ユーザー",
    path: "/users",
  },
  // ... 既存メニュー
]
```

### 3. 共有コンポーネント（再利用推奨）

以下の既存UIコンポーネントを各画面で統一的に使用する:

| コンポーネント | パス | 用途 |
|-------------|------|------|
| `Table` / `TableHeader` / `TableBody` / `TableRow` / `TableCell` | `components/ui/table` | テーブル表示 |
| `Pagination` | `components/ui/table/Pagination` | ページネーション |
| `Button` | `components/ui/button/Button` | ボタン |
| `Modal` | `components/ui/modal` | モーダルダイアログ |
| `Badge` | `components/ui/badge/Badge` | ステータス表示 |
| `Input` | `components/ui/form/InputField` | テキスト入力 |
| `Select` | `components/ui/form/Select` | ドロップダウン |
| `Label` | `components/ui/form/Label` | フォームラベル |
| `Alert` | `components/ui/alert/Alert` | エラー・成功通知 |
| `ComponentCard` | `components/layout/ComponentCard` | ページセクション |
| `PageBreadcrumb` | `components/layout/PageBreadCrumb` | パンくずナビ |

**テーブルのスタイルは `BasicTableOne` パターンに統一する:**
- ヘッダーセル: `className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"`
- ボディセル: `className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400"`
- 外枠: `className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3"`
- TableHeader: `className="border-b border-gray-100 dark:border-white/5"`
- TableBody: `className="divide-y divide-gray-100 dark:divide-white/5"`

**フォームは raw `<input>` / `<select>` を使わず、必ず既存コンポーネントを使う。**

## 動作確認

```bash
cd apps/admin && pnpm build
```

サイドバーに「マスター管理」「ユーザー」が表示されること。
