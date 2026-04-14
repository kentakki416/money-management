import { Request, Response } from "express"

import { ErrorResponse , updateCategoryRequestSchema, updateCategoryResponseSchema } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリ更新API
 */
export class AdminCategoryUpdateController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(req: Request, res: Response) {
    try {
      const id = Number(req.params.id)

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = {
          error: "Invalid category ID",
          status_code: 400,
        }
        return res.status(400).json(errorResponse)
      }

      const data = updateCategoryRequestSchema.parse(req.body)

      const category = await service.category.updateCategory(
        id,
        {
          color: data.color,
          name: data.name,
          sortOrder: data.sort_order,
        },
        this.categoryRepository
      )

      if (!category) {
        const errorResponse: ErrorResponse = {
          error: "Category not found",
          status_code: 404,
        }
        return res.status(404).json(errorResponse)
      }

      const response = updateCategoryResponseSchema.parse({
        category: {
          id: category.id,
          color: category.color,
          name: category.name,
          sort_order: category.sortOrder,
          created_at: category.createdAt.toISOString(),
          updated_at: category.updatedAt.toISOString(),
        },
      })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "AdminCategoryUpdateController: Failed to update category",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to update category",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
