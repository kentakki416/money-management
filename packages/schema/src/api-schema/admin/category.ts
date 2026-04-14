// ========================================================
// /api/admin/categories - 管理画面カテゴリ管理
// 現時点は既存スキーマと同一のため re-export
// Admin 固有のレスポンスが必要になった場合はここで定義する
// ========================================================

export {
  categorySchema,
  createCategoryRequestSchema,
  createCategoryResponse,
  getCategoryListResponseSchema,
  updateCategoryRequestSchema,
  updateCategoryResponseSchema,
} from "../category"

export type {
  Category,
  CreateCategoryReponse,
  CreateCategoryRequest,
  GetCategoryListResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
} from "../category"
