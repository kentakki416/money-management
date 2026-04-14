// ========================================================
// /api/admin/category-rules - 管理画面分類ルール管理
// 現時点は既存スキーマと同一のため re-export
// Admin 固有のレスポンスが必要になった場合はここで定義する
// ========================================================

export {
  categoryRuleSchema,
  createCategoryRuleRequestSchema,
  createCategoryRuleResponseSchema,
  deleteCategoryRuleResponseSchema,
  getCategoryRuleListResponseSchema,
  updateCategoryRuleRequestSchema,
  updateCategoryRuleResponseSchema,
} from "../category-rule"

export type {
  CategoryRule,
  CreateCategoryRuleRequest,
  CreateCategoryRuleResponse,
  DeleteCategoryRuleResponse,
  GetCategoryRuleListResponse,
  UpdateCategoryRuleRequest,
  UpdateCategoryRuleResponse,
} from "../category-rule"
