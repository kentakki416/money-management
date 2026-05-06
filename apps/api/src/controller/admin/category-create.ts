import { Request, Response } from "express"

import { ErrorResponse, createCategoryRequestSchema, createCategoryResponse } from "@repo/api-schema"

import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリ作成API
 */
export class AdminCategoryCreateController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(req: Request, res: Response) {
    const data = createCategoryRequestSchema.parse(req.body)

    const result = await service.category.createCategory(
      {
        color: data.color,
        name: data.name,
        sortOrder: data.sort_order,
      },
      { categoryRepository: this.categoryRepository }
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = createCategoryResponse.parse({
      category: {
        id: result.value.id,
        color: result.value.color,
        name: result.value.name,
        sort_order: result.value.sortOrder,
        created_at: result.value.createdAt.toISOString(),
        updated_at: result.value.updatedAt.toISOString(),
      },
    })
    return res.status(201).json(response)
  }
}
