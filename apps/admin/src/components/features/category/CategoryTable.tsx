"use client"

import { useState } from "react"

import type {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@repo/api-schema"

import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/(dashboard)/categories/actions"
import Alert from "@/components/ui/alert/Alert"
import Button from "@/components/ui/button/Button"
import Input from "@/components/ui/form/InputField"
import Label from "@/components/ui/form/Label"
import { Modal } from "@/components/ui/modal"
import { type Column, DataTable } from "@/components/ui/table"

type CategoryForm = {
  color: string
  name: string
  sort_order: number
}

const INITIAL_FORM: CategoryForm = {
  color: "#FF6384",
  name: "",
  sort_order: 0,
}

interface CategoryTableProps {
  categories: Category[]
}

export default function CategoryTable({ categories }: CategoryTableProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [form, setForm] = useState<CategoryForm>(INITIAL_FORM)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenCreate = () => {
    setForm(INITIAL_FORM)
    setError(null)
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setForm({
      color: category.color,
      name: category.name,
      sort_order: category.sort_order,
    })
    setError(null)
    setEditingCategory(category)
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const data: CreateCategoryRequest = {
        color: form.color,
        name: form.name,
        sort_order: form.sort_order,
      }
      await createCategory(data)
      setIsCreateModalOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingCategory) return
    setIsSubmitting(true)
    setError(null)
    try {
      const data: UpdateCategoryRequest = {
        color: form.color,
        name: form.name,
        sort_order: form.sort_order,
      }
      await updateCategory(editingCategory.id, data)
      setEditingCategory(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingCategory) return
    setIsSubmitting(true)
    setError(null)
    try {
      await deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: Column<Category>[] = [
    { header: "ID", key: "id" },
    {
      header: "カラー",
      render: (cat) => (
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
          <span>{cat.color}</span>
        </div>
      ),
    },
    {
      className:
        "px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white/90",
      header: "カテゴリ名",
      key: "name",
    },
    { header: "表示順", key: "sort_order" },
    {
      header: "Actions",
      render: (cat) => (
        <div className="flex items-center gap-3">
          <button
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white/90"
            onClick={() => handleOpenEdit(cat)}
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
            onClick={() => setDeletingCategory(cat)}
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
          カテゴリ一覧
        </h2>
        <Button size="sm" onClick={handleOpenCreate}>
          新規追加
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        getRowKey={(cat) => cat.id}
      />

      {/* 作成モーダル */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            カテゴリ追加
          </h3>
          {error && <div className="mb-4"><Alert message={error} title="エラー" variant="error" /></div>}
          <CategoryFormFields form={form} setForm={setForm} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              キャンセル
            </Button>
            <Button disabled={isSubmitting} onClick={handleCreate}>
              {isSubmitting ? "作成中..." : "作成"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 編集モーダル */}
      <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            カテゴリ編集
          </h3>
          {error && <div className="mb-4"><Alert message={error} title="エラー" variant="error" /></div>}
          <CategoryFormFields form={form} setForm={setForm} />
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              キャンセル
            </Button>
            <Button disabled={isSubmitting} onClick={handleUpdate}>
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal isOpen={!!deletingCategory} onClose={() => setDeletingCategory(null)}>
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            カテゴリ削除
          </h3>
          {error && <div className="mb-4"><Alert message={error} title="エラー" variant="error" /></div>}
          <p className="text-gray-600 dark:text-gray-300">
            「{deletingCategory?.name}」を削除しますか？
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingCategory(null)}>
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

interface CategoryFormFieldsProps {
  form: CategoryForm
  setForm: (form: CategoryForm) => void
}

function CategoryFormFields({ form, setForm }: CategoryFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>カテゴリ名</Label>
        <Input
          defaultValue={form.name}
          type="text"
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
          defaultValue={form.sort_order}
          type="number"
          onChange={(e) =>
            setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })
          }
        />
      </div>
    </div>
  )
}
