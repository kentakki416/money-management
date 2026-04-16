import { Request, Response } from "express"

import { ErrorResponse, updateCategoryPathParamSchema, updateCategoryRequestSchema, updateCategoryResponseSchema } from "@repo/api-schema"

import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリ更新API
 */
export class CategoryUpdateController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(req: Request, res: Response) {
    const { id } = updateCategoryPathParamSchema.parse(req.params)
    const data = updateCategoryRequestSchema.parse(req.body)
    const result = await service.category.updateCategory(
      id,
      {
        color: data.color,
        name: data.name,
        sortOrder: data.sort_order,
      },
      this.categoryRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = updateCategoryResponseSchema.parse({
      category: {
        color: result.value.color,
        created_at: result.value.createdAt.toISOString(),
        id: result.value.id,
        name: result.value.name,
        sort_order: result.value.sortOrder,
        updated_at: result.value.updatedAt.toISOString(),
      },
    })
    return res.status(200).json(response)
  }
}
