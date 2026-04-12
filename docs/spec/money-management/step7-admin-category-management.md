# Step7: Admin - カテゴリ・分類ルール管理画面

管理画面にカテゴリマスターと自動分類ルールのCRUD画面を追加する。Admin画面の既存パターン（サイドバー・テーブル・モーダル）を踏襲する。

## 対応内容

### 1. サイドバーにメニュー追加

`apps/admin/src/components/layout/AppSidebar.tsx` の `navItems` を修正:

```typescript
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Ecommerce", path: "/", pro: false }],
  },
  {
    icon: <ListIcon />,
    name: "マスター管理",
    subItems: [
      { name: "カテゴリ管理", path: "/categories", pro: false },
      { name: "分類ルール管理", path: "/category-rules", pro: false },
    ],
  },
  // ... 既存のメニュー項目
]
```

### 2. API クライアント

`apps/admin/src/lib/api-client.ts` を作成:

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

export const apiClient = {
  delete: async (path: string) => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      method: "DELETE",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json()
  },

  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  post: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },

  put: async <T>(path: string, body: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: JSON.stringify(body),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  },
}
```

### 3. カテゴリ管理画面

`apps/admin/src/app/(dashboard)/categories/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  Category,
  CreateCategoryRequest,
  GetCategoryListResponse,
  UpdateCategoryRequest,
} from "@repo/api-schema"

import ComponentCard from "@/components/layout/ComponentCard"
import PageBreadcrumb from "@/components/layout/PageBreadCrumb"
import Button from "@/components/ui/button/Button"
import { Modal } from "@/components/ui/modal/Modal"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table/Table"
import { apiClient } from "@/lib/api-client"

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [form, setForm] = useState<CreateCategoryRequest>({
    color: "#FF6384",
    name: "",
    sort_order: 0,
  })

  const fetchCategories = useCallback(async () => {
    const data = await apiClient.get<GetCategoryListResponse>("/api/categories")
    setCategories(data.categories)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleSubmit = async () => {
    if (editingCategory) {
      const updateBody: UpdateCategoryRequest = {
        color: form.color,
        name: form.name,
        sort_order: form.sort_order,
      }
      await apiClient.put(`/api/categories/${editingCategory.id}`, updateBody)
    } else {
      await apiClient.post("/api/categories", form)
    }
    setIsModalOpen(false)
    setEditingCategory(null)
    setForm({ color: "#FF6384", name: "", sort_order: 0 })
    await fetchCategories()
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setForm({
      color: category.color,
      name: category.name,
      sort_order: category.sort_order,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("このカテゴリを削除しますか？")) return
    await apiClient.delete(`/api/categories/${id}`)
    await fetchCategories()
  }

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setForm({ color: "#FF6384", name: "", sort_order: 0 })
    setIsModalOpen(true)
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="カテゴリ管理" />

      <ComponentCard title="カテゴリ一覧">
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={handleOpenCreate}>
            新規追加
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>ID</TableCell>
                  <TableCell isHeader>カラー</TableCell>
                  <TableCell isHeader>カテゴリ名</TableCell>
                  <TableCell isHeader>表示順</TableCell>
                  <TableCell isHeader>操作</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>{cat.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.color}
                      </div>
                    </TableCell>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell>{cat.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cat)}
                        >
                          編集
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(cat.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ComponentCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            {editingCategory ? "カテゴリ編集" : "カテゴリ追加"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                カテゴリ名
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                カラー
              </label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                表示順
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) =>
                  setForm({ ...form, sort_order: parseInt(e.target.value, 10) })
                }
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              {editingCategory ? "更新" : "作成"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
```

### 4. 分類ルール管理画面

`apps/admin/src/app/(dashboard)/category-rules/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  Category,
  CategoryRule,
  CreateCategoryRuleRequest,
  GetCategoryListResponse,
  GetCategoryRuleListResponse,
  UpdateCategoryRuleRequest,
} from "@repo/api-schema"

import ComponentCard from "@/components/layout/ComponentCard"
import PageBreadcrumb from "@/components/layout/PageBreadCrumb"
import Button from "@/components/ui/button/Button"
import { Modal } from "@/components/ui/modal/Modal"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table/Table"
import { apiClient } from "@/lib/api-client"

export default function CategoryRulesPage() {
  const [rules, setRules] = useState<CategoryRule[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null)
  const [form, setForm] = useState<CreateCategoryRuleRequest>({
    category_id: 1,
    keyword: "",
    match_type: "PARTIAL",
    priority: 10,
  })

  const fetchData = useCallback(async () => {
    const [rulesData, categoriesData] = await Promise.all([
      apiClient.get<GetCategoryRuleListResponse>("/api/category-rules"),
      apiClient.get<GetCategoryListResponse>("/api/categories"),
    ])
    setRules(rulesData.rules)
    setCategories(categoriesData.categories)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSubmit = async () => {
    if (editingRule) {
      const updateBody: UpdateCategoryRuleRequest = {
        category_id: form.category_id,
        keyword: form.keyword,
        match_type: form.match_type,
        priority: form.priority,
      }
      await apiClient.put(`/api/category-rules/${editingRule.id}`, updateBody)
    } else {
      await apiClient.post("/api/category-rules", form)
    }
    setIsModalOpen(false)
    setEditingRule(null)
    await fetchData()
  }

  const handleEdit = (rule: CategoryRule) => {
    setEditingRule(rule)
    setForm({
      category_id: rule.category_id,
      keyword: rule.keyword,
      match_type: rule.match_type,
      priority: rule.priority,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("このルールを削除しますか？")) return
    await apiClient.delete(`/api/category-rules/${id}`)
    await fetchData()
  }

  const handleOpenCreate = () => {
    setEditingRule(null)
    setForm({ category_id: categories[0]?.id ?? 1, keyword: "", match_type: "PARTIAL", priority: 10 })
    setIsModalOpen(true)
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="分類ルール管理" />

      <ComponentCard title="分類ルール一覧">
        <div className="mb-4 flex justify-end">
          <Button size="sm" onClick={handleOpenCreate}>
            新規追加
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>ID</TableCell>
                  <TableCell isHeader>キーワード</TableCell>
                  <TableCell isHeader>マッチタイプ</TableCell>
                  <TableCell isHeader>カテゴリ</TableCell>
                  <TableCell isHeader>優先度</TableCell>
                  <TableCell isHeader>操作</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>{rule.id}</TableCell>
                    <TableCell>
                      <code className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-700">
                        {rule.keyword}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          rule.match_type === "EXACT"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {rule.match_type}
                      </span>
                    </TableCell>
                    <TableCell>{rule.category_name}</TableCell>
                    <TableCell>{rule.priority}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                        >
                          編集
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(rule.id)}
                        >
                          削除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ComponentCard>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="max-w-md"
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            {editingRule ? "ルール編集" : "ルール追加"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                キーワード
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                type="text"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                マッチタイプ
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={form.match_type}
                onChange={(e) =>
                  setForm({ ...form, match_type: e.target.value as "PARTIAL" | "EXACT" })
                }
              >
                <option value="PARTIAL">部分一致 (PARTIAL)</option>
                <option value="EXACT">完全一致 (EXACT)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                カテゴリ
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: parseInt(e.target.value, 10) })
                }
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                優先度
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                type="number"
                value={form.priority ?? 10}
                onChange={(e) =>
                  setForm({ ...form, priority: parseInt(e.target.value, 10) })
                }
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              {editingRule ? "更新" : "作成"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
```

## 動作確認

### 画面確認

```bash
cd apps/admin
pnpm dev
```

1. `http://localhost:3030/categories` にアクセス
   - カテゴリ一覧テーブルが表示される
   - 「新規追加」ボタンでモーダルが開く
   - カテゴリ名・カラー・表示順を入力して作成できる
   - 「編集」ボタンで既存カテゴリを変更できる
   - 「削除」ボタンで確認ダイアログ後に削除できる

2. `http://localhost:3030/category-rules` にアクセス
   - ルール一覧テーブルが表示される
   - キーワード・マッチタイプ・カテゴリ・優先度が確認できる
   - CRUD操作が正常に動作する

3. サイドバーの「マスター管理」から各画面に遷移できる
