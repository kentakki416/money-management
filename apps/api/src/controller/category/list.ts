import { Request, Response } from "express"

import { ErrorResponse, getCategoryListResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリ一覧取得API
 */
export class CategoryListController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(_req: Request, res: Response) {
    try {
      const categories = await service.category.getAllCategories(this.categoryRepository)

      const response = getCategoryListResponseSchema.parse({
        categories: categories.map((c) => ({
          color: c.color,
          created_at: c.createdAt.toISOString(),
          id: c.id,
          name: c.name,
          sort_order: c.sortOrder,
          updated_at: c.updatedAt.toISOString(),
        })),
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "CategoryListController: Failed to get categories",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to get categories",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
