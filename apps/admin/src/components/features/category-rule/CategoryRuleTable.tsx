"use client"

import { useState } from "react"

import type {
  Category,
  CategoryRule,
  CreateCategoryRuleRequest,
  UpdateCategoryRuleRequest,
} from "@repo/api-schema"

import {
  createCategoryRule,
  deleteCategoryRule,
  updateCategoryRule,
} from "@/app/(dashboard)/category-rules/actions"
import Alert from "@/components/ui/alert/Alert"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/ui/form/InputField"
import Label from "@/components/ui/form/Label"
import Select from "@/components/ui/form/Select"
import { Modal } from "@/components/ui/modal"
import { type Column, DataTable, type FilterConfig } from "@/components/ui/table"

type CategoryRuleForm = {
  category_id: number
  keyword: string
  match_type: "EXACT" | "PARTIAL"
  priority: number
}

interface CategoryRuleTableProps {
  categories: Category[]
  rules: CategoryRule[]
}

export default function CategoryRuleTable({
  categories,
  rules,
}: CategoryRuleTableProps) {
  const initialForm: CategoryRuleForm = {
    category_id: categories[0]?.id ?? 0,
    keyword: "",
    match_type: "PARTIAL",
    priority: 10,
  }

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CategoryRule | null>(null)
  const [deletingRule, setDeletingRule] = useState<CategoryRule | null>(null)
  const [form, setForm] = useState<CategoryRuleForm>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filterConfigs: FilterConfig<CategoryRule>[] = [
    {
      key: "match_type",
      label: "マッチタイプ",
      options: [
        { label: "部分一致 (PARTIAL)", value: "PARTIAL" },
        { label: "完全一致 (EXACT)", value: "EXACT" },
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
  ]

  const handleOpenCreate = () => {
    setForm(initialForm)
    setError(null)
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (rule: CategoryRule) => {
    setForm({
      category_id: rule.category_id,
      keyword: rule.keyword,
      match_type: rule.match_type as "EXACT" | "PARTIAL",
      priority: rule.priority,
    })
    setError(null)
    setEditingRule(rule)
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const data: CreateCategoryRuleRequest = {
        category_id: form.category_id,
        keyword: form.keyword,
        match_type: form.match_type,
        priority: form.priority,
      }
      await createCategoryRule(data)
      setIsCreateModalOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingRule) return
    setIsSubmitting(true)
    setError(null)
    try {
      const data: UpdateCategoryRuleRequest = {
        category_id: form.category_id,
        keyword: form.keyword,
        match_type: form.match_type,
        priority: form.priority,
      }
      await updateCategoryRule(editingRule.id, data)
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
    try {
      await deleteCategoryRule(deletingRule.id)
      setDeletingRule(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<CategoryRule>[] = [
    { header: "ID", key: "id" },
    {
      header: "キーワード",
      render: (rule) => (
        <code className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          {rule.keyword}
        </code>
      ),
    },
    {
      header: "マッチタイプ",
      render: (rule) => (
        <Badge color={rule.match_type === "EXACT" ? "info" : "success"}>
          {rule.match_type}
        </Badge>
      ),
    },
    { header: "カテゴリ", key: "category_name" },
    { header: "優先度", key: "priority" },
    {
      header: "Actions",
      render: (rule) => (
        <div className="flex items-center gap-3">
          <button
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white/90"
            onClick={() => handleOpenEdit(rule)}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="text-gray-500 hover:text-error-500"
            onClick={() => setDeletingRule(rule)}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          分類ルール一覧
        </h2>
        <Button size="sm" onClick={handleOpenCreate}>
          新規追加
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        filters={filterConfigs}
        getRowKey={(rule) => rule.id}
        pagination={{ pageSizeOptions: [10, 20, 50] }}
        search={{
          filterKeys: ["keyword", "category_name"],
          placeholder: "キーワード・カテゴリ名で検索...",
        }}
      />

      {/* 作成モーダル */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            ルール追加
          </h3>
          {error && (
            <div className="mb-4">
              <Alert message={error} title="エラー" variant="error" />
            </div>
          )}
          <CategoryRuleFormFields
            categories={categories}
            form={form}
            setForm={setForm}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              キャンセル
            </Button>
            <Button disabled={isSubmitting} onClick={handleCreate}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={!!editingRule} onClose={() => setEditingRule(null)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            ルール編集
          </h3>
          {error && (
            <div className="mb-4">
              <Alert message={error} title="エラー" variant="error" />
            </div>
          )}
          <CategoryRuleFormFields
            categories={categories}
            form={form}
            setForm={setForm}
          />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingRule(null)}>
              キャンセル
            </Button>
            <Button disabled={isSubmitting} onClick={handleUpdate}>
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal isOpen={!!deletingRule} onClose={() => setDeletingRule(null)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            ルール削除
          </h3>
          {error && (
            <div className="mb-4">
              <Alert message={error} title="エラー" variant="error" />
            </div>
          )}
          <p className="text-gray-600 dark:text-gray-300">
            キーワード「{deletingRule?.keyword}」のルールを削除しますか？
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingRule(null)}>
              キャンセル
            </Button>
            <Button disabled={isSubmitting} onClick={handleDelete}>
              {isSubmitting ? "削除中..." : "削除"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

interface CategoryRuleFormFieldsProps {
  categories: Category[]
  form: CategoryRuleForm
  setForm: (form: CategoryRuleForm) => void
}

function CategoryRuleFormFields({
  categories,
  form,
  setForm,
}: CategoryRuleFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>キーワード</Label>
        <Input
          defaultValue={form.keyword}
          type="text"
          onChange={(e) => setForm({ ...form, keyword: e.target.value })}
        />
      </div>
      <div>
        <Label>マッチタイプ</Label>
        <Select
          defaultValue={form.match_type}
          options={[
            { label: "部分一致 (PARTIAL)", value: "PARTIAL" },
            { label: "完全一致 (EXACT)", value: "EXACT" },
          ]}
          onChange={(value) =>
            setForm({ ...form, match_type: value as "EXACT" | "PARTIAL" })
          }
        />
      </div>
      <div>
        <Label>カテゴリ</Label>
        <Select
          defaultValue={String(form.category_id)}
          options={categories.map((cat) => ({
            label: cat.name,
            value: String(cat.id),
          }))}
          onChange={(value) =>
            setForm({ ...form, category_id: parseInt(value, 10) })
          }
        />
      </div>
      <div>
        <Label>優先度</Label>
        <Input
          defaultValue={form.priority}
          type="number"
          onChange={(e) =>
            setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })
          }
        />
      </div>
    </div>
  )
}
