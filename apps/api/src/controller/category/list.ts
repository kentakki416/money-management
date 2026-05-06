import { Request, Response } from "express"

import { ErrorResponse, getCategoryListResponseSchema } from "@repo/api-schema"

import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリ一覧取得API
 */
export class CategoryListController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(_req: Request, res: Response) {
    const result = await service.category.getAllCategories({ categoryRepository: this.categoryRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = getCategoryListResponseSchema.parse({
      categories: result.value.map((c) => ({
        color: c.color,
        created_at: c.createdAt.toISOString(),
        id: c.id,
        name: c.name,
        sort_order: c.sortOrder,
        updated_at: c.updatedAt.toISOString(),
      })),
    })
    return res.status(200).json(response)
  }
}
