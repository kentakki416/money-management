import { Request, Response } from "express"

import { ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { CategoryRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * カテゴリ削除API
 */
export class CategoryDeleteController {
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

      const deleted = await service.category.deleteCategory(id, this.categoryRepository)

      if (!deleted) {
        const errorResponse: ErrorResponse = {
          error: "Category not found",
          status_code: 404,
        }
        return res.status(404).json(errorResponse)
      }

      res.status(200).json({ message: "Category deleted successfully" })
    } catch (error) {
      logger.error(
        "CategoryDeleteController: Failed to delete category",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to delete category",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
