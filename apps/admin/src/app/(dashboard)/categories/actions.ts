"use server"

import { revalidatePath } from "next/cache"

import type { CreateCategoryRequest, UpdateCategoryRequest } from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * カテゴリを作成する
 */
export const createCategory = async (data: CreateCategoryRequest) => {
  await apiClient.post("/api/admin/categories", data)
  revalidatePath("/categories")
}

/**
 * カテゴリを更新する
 */
export const updateCategory = async (id: number, data: UpdateCategoryRequest) => {
  await apiClient.put(`/api/admin/categories/${id}`, data)
  revalidatePath("/categories")
}

/**
 * カテゴリを削除する
 */
export const deleteCategory = async (id: number) => {
  await apiClient.delete(`/api/admin/categories/${id}`)
  revalidatePath("/categories")
}
