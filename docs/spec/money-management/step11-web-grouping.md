# Step11: Web - グルーピング管理（カテゴリ・支払い元）

Web 画面からカテゴリの追加・編集・削除と、支払い元の追加・削除を行えるようにする。Admin 画面を使わなくてもユーザー自身がグルーピングを管理できる。

## 対応内容

### 1. サイドバーメニューの更新

`apps/web/src/components/layout/AppSidebar.tsx` の `navItems` にグルーピング管理を追加:

```typescript
import {
  BarChart3,
  Calendar,
  CreditCard,
  FolderPlus,
  LayoutDashboard,
  List,
  Upload,
} from "lucide-react"

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "ダッシュボード",
    path: "/",
  },
  {
    icon: <Calendar size={20} />,
    name: "カレンダー",
    path: "/calendar",
  },
  {
    icon: <FolderPlus size={20} />,
    name: "グルーピング",
    path: "/grouping",
  },
  {
    icon: <BarChart3 size={20} />,
    name: "グラフ",
    path: "/charts",
  },
  {
    icon: <Upload size={20} />,
    name: "CSVアップロード",
    path: "/upload",
  },
  {
    icon: <List size={20} />,
    name: "取引一覧",
    path: "/transactions",
  },
  {
    icon: <CreditCard size={20} />,
    name: "支払い元管理",
    path: "/payment-sources",
  },
]
```

### 2. グルーピング管理画面（カテゴリ）

`apps/web/src/app/(dashboard)/grouping/page.tsx` を作成:

カテゴリの一覧表示・追加・編集・削除と、各カテゴリに紐づく自動分類ルールの管理を1画面で行う。

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  Category,
  CategoryRule,
  CreateCategoryRequest,
  GetCategoryListResponse,
  GetCategoryRuleListResponse,
  GetUserCategoryRuleListResponse,
  UserCategoryRule,
} from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function GroupingPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [masterRules, setMasterRules] = useState<CategoryRule[]>([])
  const [userRules, setUserRules] = useState<UserCategoryRule[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [isAddingRule, setIsAddingRule] = useState(false)

  // カテゴリ追加フォーム
  const [categoryForm, setCategoryForm] = useState<CreateCategoryRequest>({
    color: "#FF6384",
    name: "",
  })

  // ルール追加フォーム
  const [ruleForm, setRuleForm] = useState({
    category_id: 0,
    keyword: "",
    match_type: "PARTIAL" as "PARTIAL" | "EXACT",
    priority: 10,
  })

  const fetchCategories = useCallback(async () => {
    const data = await apiClient.get<GetCategoryListResponse>("/api/categories")
    setCategories(data.categories)
  }, [])

  const fetchRules = useCallback(async () => {
    const [masterData, userData] = await Promise.all([
      apiClient.get<GetCategoryRuleListResponse>("/api/category-rules"),
      apiClient.get<GetUserCategoryRuleListResponse>("/api/user-category-rules"),
    ])
    setMasterRules(masterData.rules)
    setUserRules(userData.rules)
  }, [])

  useEffect(() => {
    fetchCategories()
    fetchRules()
  }, [fetchCategories, fetchRules])

  // --- カテゴリ操作 ---

  const handleCreateCategory = async () => {
    if (!categoryForm.name) return
    await apiClient.post("/api/categories", categoryForm)
    setCategoryForm({ color: "#FF6384", name: "" })
    setIsAddingCategory(false)
    await fetchCategories()
  }

  const handleUpdateCategory = async (id: number) => {
    await apiClient.put(`/api/categories/${id}`, categoryForm)
    setEditingCategoryId(null)
    setCategoryForm({ color: "#FF6384", name: "" })
    await fetchCategories()
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("このカテゴリを削除しますか？紐づく取引は「未分類」になります。")) return
    await apiClient.delete(`/api/categories/${id}`)
    if (selectedCategoryId === id) setSelectedCategoryId(null)
    await fetchCategories()
  }

  const startEditCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setCategoryForm({ color: category.color, name: category.name })
  }

  // --- ルール操作 ---

  const handleCreateRule = async () => {
    if (!ruleForm.keyword || !ruleForm.category_id) return
    await apiClient.post("/api/user-category-rules", ruleForm)
    setRuleForm({ category_id: selectedCategoryId ?? 0, keyword: "", match_type: "PARTIAL", priority: 10 })
    setIsAddingRule(false)
    await fetchRules()
  }

  const handleDeleteRule = async (id: number) => {
    if (!confirm("このルールを削除しますか？")) return
    await apiClient.delete(`/api/user-category-rules/${id}`)
    await fetchRules()
  }

  // ユーザールールとマスタールールを結合し、ソース種別を付与
  const allRules = [
    ...userRules.map((r) => ({ ...r, source: "user" as const })),
    ...masterRules.map((r) => ({ ...r, source: "master" as const })),
  ]

  // 選択中カテゴリのルール
  const filteredRules = selectedCategoryId
    ? allRules.filter((r) => r.category_id === selectedCategoryId)
    : allRules

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">グルーピング管理</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左: カテゴリ一覧 */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">カテゴリ</h2>
            <button
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
              onClick={() => {
                setIsAddingCategory(true)
                setCategoryForm({ color: "#FF6384", name: "" })
              }}
            >
              追加
            </button>
          </div>

          {/* カテゴリ追加フォーム */}
          {isAddingCategory && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
              <input
                className="h-8 w-8 cursor-pointer rounded border-0"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
              />
              <input
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="カテゴリ名"
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <button
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                onClick={handleCreateCategory}
              >
                保存
              </button>
              <button
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setIsAddingCategory(false)}
              >
                キャンセル
              </button>
            </div>
          )}

          {/* カテゴリリスト */}
          <div className="space-y-1">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${
                  selectedCategoryId === category.id
                    ? "bg-brand-50 dark:bg-brand-500/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                onClick={() => setSelectedCategoryId(
                  selectedCategoryId === category.id ? null : category.id
                )}
              >
                {editingCategoryId === category.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      className="h-6 w-6 cursor-pointer rounded border-0"
                      type="color"
                      value={categoryForm.color}
                      onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    />
                    <input
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    />
                    <button
                      className="text-xs text-brand-600 hover:text-brand-700"
                      onClick={(e) => { e.stopPropagation(); handleUpdateCategory(category.id) }}
                    >
                      保存
                    </button>
                    <button
                      className="text-xs text-gray-500"
                      onClick={(e) => { e.stopPropagation(); setEditingCategoryId(null) }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {allRules.filter((r) => r.category_id === category.id).length}ルール
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        onClick={(e) => { e.stopPropagation(); startEditCategory(category) }}
                      >
                        編集
                      </button>
                      <button
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id) }}
                      >
                        削除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 右: 自動分類ルール */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              自動分類ルール
              {selectedCategoryId && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({categories.find((c) => c.id === selectedCategoryId)?.name} のルール)
                </span>
              )}
            </h2>
            <button
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
              onClick={() => {
                setIsAddingRule(true)
                setRuleForm({
                  category_id: selectedCategoryId ?? categories[0]?.id ?? 0,
                  keyword: "",
                  match_type: "PARTIAL",
                  priority: 10,
                })
              }}
            >
              ルール追加
            </button>
          </div>

          {/* ルール追加フォーム */}
          {isAddingRule && (
            <div className="mb-4 space-y-3 rounded-lg border border-gray-200 p-3 dark:border-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">キーワード</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    type="text"
                    value={ruleForm.keyword}
                    onChange={(e) => setRuleForm({ ...ruleForm, keyword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">カテゴリ</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={ruleForm.category_id}
                    onChange={(e) => setRuleForm({ ...ruleForm, category_id: Number(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">マッチタイプ</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    value={ruleForm.match_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, match_type: e.target.value as "PARTIAL" | "EXACT" })}
                  >
                    <option value="PARTIAL">部分一致</option>
                    <option value="EXACT">完全一致</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-500">優先度</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    min="0"
                    type="number"
                    value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                  onClick={handleCreateRule}
                >
                  保存
                </button>
                <button
                  className="text-xs text-gray-500 hover:text-gray-700"
                  onClick={() => setIsAddingRule(false)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* ルール一覧 */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2">キーワード</th>
                  <th className="px-3 py-2">タイプ</th>
                  <th className="px-3 py-2">カテゴリ</th>
                  <th className="px-3 py-2">ソース</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => (
                  <tr
                    key={`${rule.source}-${rule.id}`}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-3 py-2 text-gray-800 dark:text-white">{rule.keyword}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        rule.match_type === "EXACT"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      }`}>
                        {rule.match_type === "EXACT" ? "完全一致" : "部分一致"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                      {rule.category_name ?? categories.find((c) => c.id === rule.category_id)?.name}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        rule.source === "user"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {rule.source === "user" ? "自分" : "共通"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {rule.source === "user" ? (
                        <button
                          className="text-xs text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          削除
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredRules.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-gray-400" colSpan={5}>
                      {selectedCategoryId
                        ? "このカテゴリにルールがありません"
                        : "ルールがありません"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. 支払い元管理画面

`apps/web/src/app/(dashboard)/payment-sources/page.tsx` を作成:

```tsx
"use client"
import React, { useCallback, useEffect, useState } from "react"

import type {
  CreatePaymentSourceRequest,
  GetPaymentSourceListResponse,
  PaymentSource,
} from "@repo/api-schema"

import { apiClient } from "@/lib/api-client"

export default function PaymentSourcesPage() {
  const [sources, setSources] = useState<PaymentSource[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<CreatePaymentSourceRequest>({
    name: "",
    type: "MANUAL",
  })

  const fetchSources = useCallback(async () => {
    const data = await apiClient.get<GetPaymentSourceListResponse>("/api/payment-sources")
    setSources(data.payment_sources)
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  const handleCreate = async () => {
    if (!form.name) return
    await apiClient.post("/api/payment-sources", form)
    setForm({ name: "", type: "MANUAL" })
    setIsAdding(false)
    await fetchSources()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("この支払い元を削除しますか？紐づく取引データは残ります。")) return
    await apiClient.delete(`/api/payment-sources/${id}`)
    await fetchSources()
  }

  const typeLabel: Record<string, string> = {
    MANUAL: "手動",
    MUFG: "三菱UFJ",
    PAYPAY: "PayPay",
    SMBC: "三井住友",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">支払い元管理</h1>
        <button
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          onClick={() => setIsAdding(true)}
        >
          追加
        </button>
      </div>

      {/* 追加フォーム */}
      {isAdding && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
            支払い元を追加
          </h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                名前
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="例: メインカード"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                種類
              </label>
              <select
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as CreatePaymentSourceRequest["type"] })}
              >
                <option value="SMBC">三井住友</option>
                <option value="MUFG">三菱UFJ</option>
                <option value="PAYPAY">PayPay</option>
                <option value="MANUAL">手動</option>
              </select>
            </div>
            <button
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
              disabled={!form.name}
              onClick={handleCreate}
            >
              追加
            </button>
            <button
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => setIsAdding(false)}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 支払い元一覧 */}
      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3">名前</th>
                <th className="px-4 py-3">種類</th>
                <th className="px-4 py-3">作成日</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-gray-100 dark:border-gray-700"
                >
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {source.name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {typeLabel[source.type] ?? source.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(source.created_at).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className="text-sm text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(source.id)}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {sources.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-400" colSpan={4}>
                    支払い元が登録されていません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

## 動作確認

### 画面確認

```bash
pnpm dev
```

1. `http://localhost:3000/grouping` グルーピング管理
   - カテゴリ一覧が左側に表示される
   - 「追加」ボタンでカテゴリ名・色を指定して新規作成できる
   - カテゴリの「編集」でインライン編集できる
   - カテゴリの「削除」で確認ダイアログ後に削除される
   - カテゴリをクリックすると右側のルール一覧がフィルタされる
   - 「ルール追加」でキーワード・マッチタイプ・優先度を指定して作成できる
   - ルールの「削除」で削除される

2. `http://localhost:3000/payment-sources` 支払い元管理
   - 支払い元一覧が表示される
   - 「追加」ボタンで名前・種類を指定して新規作成できる
   - 「削除」で確認ダイアログ後に削除される

3. サイドバーのメニュー順序が正しいことを確認:
   - ダッシュボード → カレンダー → グルーピング → グラフ → CSVアップロード → 取引一覧 → 支払い元管理
