"use server"

import { revalidatePath } from "next/cache"

import type {
  CreateCategoryRuleRequest,
  UpdateCategoryRuleRequest,
} from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * 分類ルールを作成する
 */
export const createCategoryRule = async (data: CreateCategoryRuleRequest) => {
  await apiClient.post("/api/admin/category-rules", data)
  revalidatePath("/category-rules")
}

/**
 * 分類ルールを更新する
 */
export const updateCategoryRule = async (
  id: number,
  data: UpdateCategoryRuleRequest
) => {
  await apiClient.put(`/api/admin/category-rules/${id}`, data)
  revalidatePath("/category-rules")
}

/**
 * 分類ルールを削除する
 */
export const deleteCategoryRule = async (id: number) => {
  await apiClient.delete(`/api/admin/category-rules/${id}`)
  revalidatePath("/category-rules")
}
