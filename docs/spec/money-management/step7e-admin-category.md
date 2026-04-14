# Step7e: Admin - カテゴリ管理画面

カテゴリマスターのCRUD画面を実装する。

## 対応内容

### 1. ページ・Server Action 作成

**ページ:** `apps/admin/src/app/(dashboard)/categories/page.tsx`（Server Component）
- `apiClient.get` でカテゴリ一覧を取得し、Client Component に props で渡す

**Server Action:** `apps/admin/src/app/(dashboard)/categories/actions.ts`
- `"use server"` で定義
- `createCategory`, `updateCategory`, `deleteCategory` を実装
- `apiClient` を使って Express API にサーバー間通信
- 処理後に `revalidatePath("/categories")` でページを再検証

**API パス:** すべて `/api/admin/categories` 配下を使用。

| 操作 | 方式 | API パス |
|------|------|---------|
| 一覧取得 | Server Component | `GET /api/admin/categories` |
| 作成 | Server Action | `POST /api/admin/categories` |
| 更新 | Server Action | `PUT /api/admin/categories/:id` |
| 削除 | Server Action | `DELETE /api/admin/categories/:id` |

### 2. テーブル

`BasicTableOne` パターンに準拠（step7c 参照）。

カラム構成:

| カラム | 内容 |
|-------|------|
| ID | `cat.id` |
| カラー | 色付き丸 + HEXコード |
| カテゴリ名 | `cat.name`（`font-medium text-gray-800`） |
| 表示順 | `cat.sort_order` |
| Actions | 編集アイコン + 削除アイコン |

**Actions アイコン:**
- 編集（ペンアイコン）: `text-gray-500 hover:text-gray-800 dark:hover:text-white/90`
- 削除（ゴミ箱アイコン）: `text-gray-500 hover:text-error-500`

### 3. モーダルフォーム

`Modal` コンポーネント（`components/ui/modal`）を使用。

**フォーム要素は既存UIコンポーネントを使う（raw `<input>` 禁止）:**

```tsx
import Input from "@/components/ui/form/InputField"
import Label from "@/components/ui/form/Label"

<div>
  <Label>カテゴリ名</Label>
  <Input
    type="text"
    defaultValue={form.name}
    onChange={(e) => setForm({ ...form, name: e.target.value })}
  />
</div>

<div>
  <Label>カラー</Label>
  <div className="flex items-center gap-2">
    <input
      className="h-10 w-10 cursor-pointer rounded"
      type="color"
      value={form.color}
      onChange={(e) => setForm({ ...form, color: e.target.value })}
    />
    <span className="text-sm text-gray-500">{form.color}</span>
  </div>
</div>

<div>
  <Label>表示順</Label>
  <Input
    type="number"
    defaultValue={form.sort_order ?? 0}
    onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) })}
  />
</div>
```

※ `type="color"` は既存コンポーネントにないため raw `<input>` を使用してよい。

### 4. エラー表示

既存の `Alert` コンポーネント（`components/ui/alert/Alert`）を使用:

```tsx
import Alert from "@/components/ui/alert/Alert"

{error && (
  <Alert variant="error" title="エラー" message={error} />
)}
```

### 5. 型定義

`@repo/api-schema` から以下をインポート:
- `Category`, `CreateCategoryRequest`, `GetCategoryListResponse`, `UpdateCategoryRequest`

## 動作確認

1. `http://localhost:3030/categories` にアクセス
2. カテゴリ一覧テーブルが表示される
3. 「新規追加」ボタンでモーダルが開く
4. カテゴリ名・カラー・表示順を入力して作成できる
5. 編集アイコンで既存カテゴリを変更できる
6. 削除アイコンで確認ダイアログ後に削除できる
