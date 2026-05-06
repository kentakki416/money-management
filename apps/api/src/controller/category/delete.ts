import { Request, Response } from "express"

import { deleteCategoryPathParamSchema, ErrorResponse } from "@repo/api-schema"

import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリ削除API
 */
export class CategoryDeleteController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(req: Request, res: Response) {
    const { id } = deleteCategoryPathParamSchema.parse(req.params)

    const result = await service.category.deleteCategory(id, { categoryRepository: this.categoryRepository })

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    return res.status(200).json({ message: "Category deleted successfully" })
  }
}
