import { Request, Response } from "express"

import { deleteCategoryPathParamSchema, ErrorResponse } from "@repo/api-schema"

import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * 管理画面カテゴリ削除API
 */
export class AdminCategoryDeleteController {
  constructor(private categoryRepository: CategoryRepository) {}

  async execute(req: Request, res: Response) {
    const { id } = deleteCategoryPathParamSchema.parse(req.params)

    const result = await service.category.deleteCategory(id, this.categoryRepository)

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = { message: "Category deleted successfully" }
    return res.status(200).json(response)
  }
}
