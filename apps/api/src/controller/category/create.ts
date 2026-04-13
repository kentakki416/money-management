import { Request, Response } from "express"

import { createCategoryRequestSchema, createCategoryResponse, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリ作成API
 */
export class CategoryCreateController {
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
          color: category.color,
          created_at: category.createdAt.toISOString(),
          id: category.id,
          name: category.name,
          sort_order: category.sortOrder,
          updated_at: category.updatedAt.toISOString(),
        },
      })

      res.status(201).json(response)
    } catch (error) {
      logger.error(
        "CategoryCreateController: Failed to create category",
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
