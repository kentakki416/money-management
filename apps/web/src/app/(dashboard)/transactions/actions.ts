"use server"

import { revalidatePath } from "next/cache"

import type { CreateTransactionRequest, UpdateTransactionRequest } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * 取引を手動作成する
 */
export const createTransaction = async (data: CreateTransactionRequest) => {
  await apiClient.post("/api/transactions", data)
  revalidatePath("/transactions")
}

/**
 * 取引を更新する（カテゴリ変更等）
 */
export const updateTransaction = async (
  id: number,
  data: UpdateTransactionRequest
) => {
  await apiClient.put(`/api/transactions/${id}`, data)
  revalidatePath("/transactions")
}

/**
 * 取引のカテゴリを更新する（ルール追加フラグ付き）
 */
export const updateTransactionCategory = async (
  id: number,
  categoryId: number,
  addRuleFlag: boolean
) => {
  const data: UpdateTransactionRequest = {
    add_rule_flag: addRuleFlag,
    category_id: categoryId,
  }
  await apiClient.put(`/api/transactions/${id}`, data)
  revalidatePath("/transactions")
}

/**
 * 取引を削除する
 */
export const deleteTransaction = async (id: number) => {
  await apiClient.delete(`/api/transactions/${id}`)
  revalidatePath("/transactions")
}
