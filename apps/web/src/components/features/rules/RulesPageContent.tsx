"use client"
import { Pencil, Plus, Trash2, X } from "lucide-react"
import React, { useMemo, useState } from "react"

import type {
  Category,
  CreateUserCategoryRuleRequest,
  UpdateUserCategoryRuleRequest,
  UserCategoryRule,
} from "@repo/api-schema"

import {
  createUserCategoryRule,
  deleteUserCategoryRule,
  updateUserCategoryRule,
} from "@/app/(dashboard)/rules/actions"
import { DataTable, type Column, type FilterConfig } from "@/components/ui/table"

type Props = {
  categories: Category[]
  initialRules: UserCategoryRule[]
}

type MatchType = "EXACT" | "PARTIAL"

type RuleForm = {
  category_id: number
  keyword: string
  match_type: MatchType
  priority: number
}

/**
 * 部分一致と完全一致の表示ラベル
 */
const MATCH_TYPE_LABEL: Record<MatchType, string> = {
  EXACT: "完全一致",
  PARTIAL: "部分一致",
}

/**
 * カテゴリ配列からカテゴリIDでカテゴリを引くマップを作成する
 */
const buildCategoryMap = (categories: Category[]): Map<number, Category> => {
  const map = new Map<number, Category>()
  categories.forEach((cat) => map.set(cat.id, cat))
  return map
}

/**
 * DataTable用の行データ型（検索・フィルタ用にフラットなフィールドを持つ）
 */
type RuleRow = UserCategoryRule & {
  category_name: string
}

export default function RulesPageContent({ categories, initialRules }: Props) {
  const [rules, setRules] = useState<UserCategoryRule[]>(initialRules)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<UserCategoryRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<UserCategoryRule | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialForm: RuleForm = {
    category_id: categories[0]?.id ?? 0,
    keyword: "",
    match_type: "PARTIAL",
    priority: 10,
  }

  const [form, setForm] = useState<RuleForm>(initialForm)

  const categoryMap = useMemo(() => buildCategoryMap(categories), [categories])

  /**
   * ルールを優先度の高い順でソートしてDataTable用の行データに変換する
   */
  const sortedRows: RuleRow[] = useMemo(() =>
    [...rules]
      .sort((a, b) => b.priority - a.priority)
      .map((rule) => ({
        ...rule,
        category_name: categoryMap.get(rule.category_id)?.name ?? "",
      })),
  [rules, categoryMap])

  const handleOpenCreate = () => {
    setForm(initialForm)
    setError(null)
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (rule: UserCategoryRule) => {
    setForm({
      category_id: rule.category_id,
      keyword: rule.keyword,
      match_type: rule.match_type,
      priority: rule.priority,
    })
    setError(null)
    setEditingRule(rule)
  }

  const handleCloseAll = () => {
    setIsCreateModalOpen(false)
    setEditingRule(null)
    setDeletingRule(null)
    setError(null)
  }

  /**
   * フォームのバリデーションを行う
   */
  const validateForm = (): string | null => {
    if (!form.keyword.trim()) return "キーワードを入力してください"
    if (!form.category_id) return "カテゴリを選択してください"
    if (form.priority < 0) return "優先度は0以上の数値で入力してください"
    return null
  }

  const handleCreate = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const data: CreateUserCategoryRuleRequest = {
        category_id: form.category_id,
        keyword: form.keyword.trim(),
        match_type: form.match_type,
        priority: form.priority,
      }
      const { reclassifiedCount, rule: createdRule } = await createUserCategoryRule(data)
      setRules((prev) => [...prev, createdRule])
      setIsCreateModalOpen(false)
      if (reclassifiedCount > 0) {
        setSuccessMessage(`ルールを作成しました。未分類だった ${reclassifiedCount} 件の取引に自動でカテゴリを割り当てました。`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingRule) return
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const data: UpdateUserCategoryRuleRequest = {
        category_id: form.category_id,
        keyword: form.keyword.trim(),
        match_type: form.match_type,
        priority: form.priority,
      }
      const updatedRule = await updateUserCategoryRule(editingRule.id, data)
      setRules((prev) =>
        prev.map((r) => (r.id === editingRule.id ? updatedRule : r))
      )
      setEditingRule(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRule) return
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const { reclassifiedCount } = await deleteUserCategoryRule(deletingRule.id)
      setRules((prev) => prev.filter((r) => r.id !== deletingRule.id))
      setDeletingRule(null)
      if (reclassifiedCount > 0) {
        setSuccessMessage(`ルールを削除しました。${reclassifiedCount} 件の取引のカテゴリを再分類しました。`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<RuleRow>[] = useMemo(() => [
    {
      header: "キーワード",
      render: (row) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          {row.keyword}
        </code>
      ),
    },
    {
      header: "マッチ方式",
      render: (row) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
            row.match_type === "EXACT"
              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          }`}
        >
          {MATCH_TYPE_LABEL[row.match_type]}
        </span>
      ),
    },
    {
      header: "カテゴリ",
      render: (row) => {
        const cat = categoryMap.get(row.category_id)
        return cat ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-gray-900 dark:text-white">
              {cat.name}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">未設定</span>
        )
      },
    },
    {
      className: "px-5 py-4 text-sm text-gray-700 dark:text-gray-300",
      header: "優先度",
      key: "priority",
    },
    {
      className: "px-5 py-4 text-right",
      header: "操作",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            aria-label="編集"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
            onClick={() => handleOpenEdit(row)}
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label="削除"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            onClick={() => setDeletingRule(row)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ], [categoryMap])

  const filters: FilterConfig<RuleRow>[] = useMemo(() => [
    {
      key: "match_type",
      label: "マッチ方式",
      options: [
        { label: "完全一致", value: "EXACT" },
        { label: "部分一致", value: "PARTIAL" },
      ],
    },
    {
      key: "category_name",
      label: "カテゴリ",
      options: categories.map((cat) => ({
        label: cat.name,
        value: cat.name,
      })),
    },
  ], [categories])

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">
            分類ルール
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            取引の説明文に応じて自動でカテゴリを割り当てる、あなた専用のルールを管理します
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
          onClick={handleOpenCreate}
        >
          <Plus size={16} />
          新規追加
        </button>
      </div>

      {/* 成功メッセージ */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/60 p-4 dark:border-green-900/40 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
          <button
            className="ml-4 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
            onClick={() => setSuccessMessage(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 使い方の説明 */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          例えば「鳥貴族」を<span className="font-semibold">部分一致</span>で
          <span className="font-semibold">飲食</span>に設定すると、店名に「鳥貴族」を含む取引は自動で「飲食」に分類されます。
          ユーザー固有のルールはマスタールールより優先されます。
        </p>
        <p className="mt-2 text-sm text-blue-900 dark:text-blue-200">
          新しいルールを追加すると、<span className="font-semibold">未分類の取引</span>に対してルールが自動で適用されます。
          既にカテゴリが設定されている取引は変更されません。
        </p>
      </div>

      {/* ルール一覧 */}
      <DataTable
        columns={columns}
        data={sortedRows}
        emptyMessage={rules.length === 0
          ? "まだルールが登録されていません。「新規追加」から最初のルールを作成しましょう。"
          : "条件に一致するルールがありません"}
        filters={filters}
        getRowKey={(row) => row.id}
        pagination={{ pageSizeOptions: [10, 20, 50] }}
        search={{
          filterKeys: ["keyword", "category_name"],
          placeholder: "キーワード・カテゴリ名で検索...",
        }}
      />

      {/* 作成モーダル */}
      {isCreateModalOpen && (
        <RuleFormModal
          categories={categories}
          error={error}
          form={form}
          isSubmitting={isSubmitting}
          setForm={setForm}
          submitLabel={isSubmitting ? "作成中..." : "作成"}
          title="ルールを追加"
          onClose={handleCloseAll}
          onSubmit={handleCreate}
        />
      )}

      {/* 編集モーダル */}
      {editingRule && (
        <RuleFormModal
          categories={categories}
          error={error}
          form={form}
          isSubmitting={isSubmitting}
          setForm={setForm}
          submitLabel={isSubmitting ? "更新中..." : "更新"}
          title="ルールを編集"
          onClose={handleCloseAll}
          onSubmit={handleUpdate}
        />
      )}

      {/* 削除確認モーダル */}
      {deletingRule && (
        <DeleteConfirmModal
          error={error}
          isSubmitting={isSubmitting}
          rule={deletingRule}
          onCancel={handleCloseAll}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

type RuleFormModalProps = {
  categories: Category[]
  error: string | null
  form: RuleForm
  isSubmitting: boolean
  onClose: () => void
  onSubmit: () => void | Promise<void>
  setForm: (form: RuleForm) => void
  submitLabel: string
  title: string
}

/**
 * 作成・編集共通のフォームモーダル
 */
function RuleFormModal({
  categories,
  error,
  form,
  isSubmitting,
  onClose,
  onSubmit,
  setForm,
  submitLabel,
  title,
}: RuleFormModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 px-5 py-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                キーワード
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="例: 鳥貴族"
                type="text"
                value={form.keyword}
                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                取引の説明文に含まれる文字列を入力してください
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                マッチ方式
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.match_type}
                onChange={(e) =>
                  setForm({ ...form, match_type: e.target.value as MatchType })
                }
              >
                <option value="PARTIAL">部分一致（キーワードを含む）</option>
                <option value="EXACT">完全一致（完全に同じ）</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                カテゴリ
              </label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.category_id}
                onChange={(e) =>
                  setForm({ ...form, category_id: Number(e.target.value) })
                }
              >
                {categories.length === 0 && <option value={0}>カテゴリなし</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                優先度
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={0}
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })
                }
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                数値が大きいほど優先されます（推奨: 10）
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              disabled={isSubmitting}
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onSubmit}
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

type DeleteConfirmModalProps = {
  error: string | null
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
  rule: UserCategoryRule
}

/**
 * 削除確認モーダル
 */
function DeleteConfirmModal({
  error,
  isSubmitting,
  onCancel,
  onConfirm,
  rule,
}: DeleteConfirmModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              ルールを削除
            </h2>
          </div>
          <div className="space-y-3 px-5 py-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              キーワード
              <code className="mx-1 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                {rule.keyword}
              </code>
              のルールを削除します。この操作は取り消せません。
            </p>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
            <button
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              disabled={isSubmitting}
              onClick={onCancel}
            >
              キャンセル
            </button>
            <button
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting ? "削除中..." : "削除"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
