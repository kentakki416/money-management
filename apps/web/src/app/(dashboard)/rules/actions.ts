"use server"

import { revalidatePath } from "next/cache"

import type {
  CreateUserCategoryRuleRequest,
  CreateUserCategoryRuleResponse,
  DeleteUserCategoryRuleResponse,
  UpdateUserCategoryRuleRequest,
  UpdateUserCategoryRuleResponse,
  UserCategoryRule,
} from "@repo/api-schema"

import { apiClient } from "@/libs/api-client"

/**
 * ユーザー固有の分類ルールを作成する
 */
export const createUserCategoryRule = async (
  data: CreateUserCategoryRuleRequest
): Promise<{ reclassifiedCount: number; rule: UserCategoryRule }> => {
  const res = await apiClient.post<CreateUserCategoryRuleResponse>(
    "/api/user-category-rules",
    data
  )
  revalidatePath("/rules")
  revalidatePath("/")
  revalidatePath("/transactions")
  return { reclassifiedCount: res.reclassified_count, rule: res.rule }
}

/**
 * ユーザー固有の分類ルールを更新する
 */
export const updateUserCategoryRule = async (
  id: number,
  data: UpdateUserCategoryRuleRequest
): Promise<UserCategoryRule> => {
  const res = await apiClient.put<UpdateUserCategoryRuleResponse>(
    `/api/user-category-rules/${id}`,
    data
  )
  revalidatePath("/rules")
  return res.rule
}

/**
 * ユーザー固有の分類ルールを削除する
 */
export const deleteUserCategoryRule = async (id: number): Promise<{ reclassifiedCount: number }> => {
  const res = await apiClient.delete<DeleteUserCategoryRuleResponse>(`/api/user-category-rules/${id}`)
  revalidatePath("/rules")
  revalidatePath("/")
  revalidatePath("/transactions")
  return { reclassifiedCount: res.reclassified_count }
}
