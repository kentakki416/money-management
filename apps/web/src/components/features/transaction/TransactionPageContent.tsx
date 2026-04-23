"use client"
import { Filter, Plus, Trash2 } from "lucide-react"
import React, { useCallback, useState } from "react"

import type {
  Category,
  GetTransactionListResponse,
  PaymentSource,
  Transaction,
} from "@repo/api-schema"

import {
  createTransaction,
  deleteTransaction,
  updateTransactionCategory,
} from "@/app/(dashboard)/transactions/actions"

interface TransactionPageContentProps {
  categories: Category[]
  initialTotalAmount: number
  initialTransactions: Transaction[]
  paymentSources: PaymentSource[]
}

export default function TransactionPageContent({
  categories,
  initialTotalAmount,
  initialTransactions,
  paymentSources,
}: TransactionPageContentProps) {
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions)
  const [totalAmount, setTotalAmount] = useState(initialTotalAmount)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const now = new Date()
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1)
  const [filterCategoryId, setFilterCategoryId] = useState<number | "">("")

  const [categoryChangeModal, setCategoryChangeModal] = useState<{
    categoryId: number
    txId: number
  } | null>(null)

  const [form, setForm] = useState({
    amount: 0,
    description: "",
    payment_source_id: 0,
    transaction_date: new Date().toISOString().split("T")[0],
  })

  const fetchTransactionsWithFilter = useCallback(
    async (year: number, month: number, categoryId: number | "") => {
      const params = new URLSearchParams({
        month: String(month),
        year: String(year),
      })
      if (categoryId) params.set("category_id", String(categoryId))

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) return
      const data: GetTransactionListResponse = await res.json()
      setTransactions(data.transactions)
      setTotalAmount(data.total_amount)
    },
    []
  )

  const refetchTransactions = useCallback(async () => {
    await fetchTransactionsWithFilter(filterYear, filterMonth, filterCategoryId)
  }, [fetchTransactionsWithFilter, filterYear, filterMonth, filterCategoryId])

  const handleYearChange = async (year: number) => {
    setFilterYear(year)
    await fetchTransactionsWithFilter(year, filterMonth, filterCategoryId)
  }

  const handleMonthChange = async (month: number) => {
    setFilterMonth(month)
    await fetchTransactionsWithFilter(filterYear, month, filterCategoryId)
  }

  const handleCategoryFilterChange = async (categoryId: number | "") => {
    setFilterCategoryId(categoryId)
    await fetchTransactionsWithFilter(filterYear, filterMonth, categoryId)
  }

  const handleCreateTransaction = async () => {
    await createTransaction(form)
    setIsFormOpen(false)
    setForm({
      amount: 0,
      description: "",
      payment_source_id: 0,
      transaction_date: new Date().toISOString().split("T")[0],
    })
    await refetchTransactions()
  }

  const handleDelete = async (id: number) => {
    if (!confirm("この取引を削除しますか？")) return
    await deleteTransaction(id)
    await refetchTransactions()
  }

  const handleCategoryChange = (txId: number, categoryId: number) => {
    setCategoryChangeModal({ categoryId, txId })
  }

  const handleCategoryChangeConfirm = async (addRuleFlag: boolean) => {
    if (!categoryChangeModal) return
    await updateTransactionCategory(
      categoryChangeModal.txId,
      categoryChangeModal.categoryId,
      addRuleFlag
    )
    setCategoryChangeModal(null)
    await refetchTransactions()
  }

  return (
    <>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          取引一覧
        </h1>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          onClick={() => setIsFormOpen(!isFormOpen)}
        >
          <Plus size={16} />
          手動登録
        </button>
      </div>

      {/* 手動登録フォーム */}
      {isFormOpen && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            取引を手動登録
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                日付
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                type="date"
                value={form.transaction_date}
                onChange={(e) =>
                  setForm({ ...form, transaction_date: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                説明
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="支払い先名"
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                金額
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min="1"
                placeholder="0"
                type="number"
                value={form.amount || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                支払い元
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                value={form.payment_source_id}
                onChange={(e) =>
                  setForm({
                    ...form,
                    payment_source_id: parseInt(e.target.value, 10),
                  })
                }
              >
                <option value={0}>選択</option>
                {paymentSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                disabled={
                  !form.description || !form.amount || !form.payment_source_id
                }
                onClick={handleCreateTransaction}
              >
                登録
              </button>
            </div>
          </div>
        </div>
      )}

      {/* フィルタバー */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <Filter size={16} />
          <span className="text-sm font-medium">フィルタ</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filterYear}
            onChange={async (e) =>
              handleYearChange(parseInt(e.target.value, 10))
            }
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}年
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filterMonth}
            onChange={async (e) =>
              handleMonthChange(parseInt(e.target.value, 10))
            }
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {m}月
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            value={filterCategoryId}
            onChange={async (e) =>
              handleCategoryFilterChange(
                e.target.value ? Number(e.target.value) : ""
              )
            }
          >
            <option value="">全カテゴリ</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto">
          <div className="rounded-lg bg-brand-50 px-4 py-2 dark:bg-brand-500/10">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              合計{" "}
            </span>
            <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
              {totalAmount.toLocaleString()}円
            </span>
          </div>
        </div>
      </div>

      {/* テーブル */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                  日付
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                  説明
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                  カテゴリ
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                  支払い元
                </th>
                <th className="px-6 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  金額
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {tx.transaction_date}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tx.description}
                    </span>
                    {tx.is_manual && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        ✏️ 手動
                      </span>
                    )}
                    {tx.csv_upload && (
                      <span
                        className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-mono text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                        title={`アップロード日時: ${new Date(tx.csv_upload.uploaded_at).toLocaleString("ja-JP")}`}
                      >
                        📄 {tx.csv_upload.file_name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs transition-colors focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      value={tx.category_id ?? ""}
                      onChange={(e) =>
                        handleCategoryChange(tx.id, Number(e.target.value))
                      }
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {tx.payment_source_name}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">
                    {tx.amount.toLocaleString()}
                    <span className="text-gray-500">円</span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                      onClick={async () => handleDelete(tx.id)}
                      title="削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td
                    className="px-6 py-12 text-center text-gray-400"
                    colSpan={6}
                  >
                    取引データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* カテゴリ変更時のルール追加確認モーダル */}
      {categoryChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              分類ルールに追加しますか？
            </h3>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              この変更を自動分類ルールに追加すると、今後のCSVアップロード時に同じ摘要の取引が自動的にこのカテゴリに分類されます。
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                onClick={async () => handleCategoryChangeConfirm(false)}
              >
                いいえ
              </button>
              <button
                className="flex-1 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
                onClick={async () => handleCategoryChangeConfirm(true)}
              >
                はい
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
