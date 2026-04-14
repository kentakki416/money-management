import { Request, Response } from "express"

import { ErrorResponse , createCategoryRequestSchema, createCategoryResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリ作成API
 */
export class AdminCategoryCreateController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(req: Request, res: Response) {
    try {
      const data = createCategoryRequestSchema.parse(req.body)

      const category = await service.category.createCategory(
        {
          color: data.color,
          name: data.name,
          sortOrder: data.sort_order,
        },
        this.categoryRepository
      )

      const response = createCategoryResponse.parse({
        category: {
          id: category.id,
          color: category.color,
          name: category.name,
          sort_order: category.sortOrder,
          created_at: category.createdAt.toISOString(),
          updated_at: category.updatedAt.toISOString(),
        },
      })

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "AdminCategoryCreateController: Failed to create category",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to create category",
        status_code: 400,
      }
      res.status(400).json(errorResponse)
    }
  }
}
