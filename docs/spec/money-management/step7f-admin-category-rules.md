# Step7f: Admin - 分類ルール管理画面

自動分類ルール（マスター）のCRUD画面を実装する。

## 対応内容

### 1. ページ・Server Action 作成

**ページ:** `apps/admin/src/app/(dashboard)/category-rules/page.tsx`（Server Component）
- `apiClient.get` でルール一覧とカテゴリ一覧を `Promise.all` で並列取得し、Client Component に props で渡す

**Server Action:** `apps/admin/src/app/(dashboard)/category-rules/actions.ts`
- `"use server"` で定義
- `createCategoryRule`, `updateCategoryRule`, `deleteCategoryRule` を実装
- 処理後に `revalidatePath("/category-rules")` でページを再検証

**API パス:** すべて `/api/admin/` 配下を使用。

| 操作 | 方式 | API パス |
|------|------|---------|
| ルール一覧取得 | Server Component | `GET /api/admin/category-rules` |
| カテゴリ一覧取得 | Server Component | `GET /api/admin/categories` |
| 作成 | Server Action | `POST /api/admin/category-rules` |
| 更新 | Server Action | `PUT /api/admin/category-rules/:id` |
| 削除 | Server Action | `DELETE /api/admin/category-rules/:id` |

初期表示時にルール一覧とカテゴリ一覧を `Promise.all` で並列取得する。

### 2. テーブル

`DataTable` コンポーネント（`components/ui/table`）を使用。

カラム定義:

```typescript
const columns: Column<CategoryRule>[] = [
  { header: "ID", key: "id" },
  {
    header: "キーワード",
    render: (rule) => <code className="...">{rule.keyword}</code>,
  },
  {
    header: "マッチタイプ",
    render: (rule) => <Badge color={...}>{rule.match_type}</Badge>,
  },
  { header: "カテゴリ", key: "category_name" },
  { header: "優先度", key: "priority" },
  {
    header: "Actions",
    render: (rule) => (/* 編集・削除アイコン */),
  },
]
```

**Badge の色分け:**
- EXACT: `info`
- PARTIAL: `success`

### 3. モーダルフォーム

**既存UIコンポーネントを使用:**

```tsx
import Input from "@/components/ui/form/InputField"
import Label from "@/components/ui/form/Label"
import Select from "@/components/ui/form/Select"

<div>
  <Label>キーワード</Label>
  <Input type="text" defaultValue={form.keyword} onChange={...} />
</div>

<div>
  <Label>マッチタイプ</Label>
  <Select
    options={[
      { label: "部分一致 (PARTIAL)", value: "PARTIAL" },
      { label: "完全一致 (EXACT)", value: "EXACT" },
    ]}
    defaultValue={form.match_type}
    onChange={(value) => setForm({ ...form, match_type: value as "PARTIAL" | "EXACT" })}
  />
</div>

<div>
  <Label>カテゴリ</Label>
  <Select
    options={categories.map((cat) => ({ label: cat.name, value: String(cat.id) }))}
    defaultValue={String(form.category_id)}
    onChange={(value) => setForm({ ...form, category_id: parseInt(value, 10) })}
  />
</div>

<div>
  <Label>優先度</Label>
  <Input type="number" defaultValue={form.priority ?? 10} onChange={...} />
</div>
```

### 4. エラー表示

カテゴリ管理と同様に `Alert` コンポーネントを使用。

### 5. 型定義

`@repo/api-schema` から以下をインポート:
- `Category`, `CategoryRule`, `CreateCategoryRuleRequest`, `GetCategoryListResponse`, `GetCategoryRuleListResponse`, `UpdateCategoryRuleRequest`

## 動作確認

1. `http://localhost:3030/category-rules` にアクセス
2. ルール一覧テーブルが表示される
3. キーワードが `<code>` タグで表示される
4. マッチタイプが Badge で色分けされる
5. CRUD操作が正常に動作する
