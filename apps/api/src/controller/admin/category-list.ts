import { Request, Response } from "express"

import { ErrorResponse, getCategoryListResponseSchema } from "@repo/api-schema"

import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリ一覧取得API
 */
export class AdminCategoryListController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(_req: Request, res: Response) {
    const result = await service.category.getAllCategories(this.categoryRepository)

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getCategoryListResponseSchema.parse({
      categories: result.value.map((c) => ({
        id: c.id,
        color: c.color,
        name: c.name,
        sort_order: c.sortOrder,
        created_at: c.createdAt.toISOString(),
        updated_at: c.updatedAt.toISOString(),
      })),
    })
    return res.status(200).json(response)
  }
}
