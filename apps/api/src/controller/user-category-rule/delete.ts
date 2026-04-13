import { Response } from "express"

import { deleteUserCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { logger } from "../../log"
import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール削除API
 */
export class UserCategoryRuleDeleteController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    try {
      const id = Number(req.params.id)
      const userId = req.userId!

      if (isNaN(id)) {
        const errorResponse: ErrorResponse = {
          error: "Invalid user category rule ID",
          status_code: 400,
        }
        return res.status(400).json(errorResponse)
      }

      await service.userCategoryRule.deleteUserCategoryRule(id, userId, this.userCategoryRuleRepository)

      const response = deleteUserCategoryRuleResponseSchema.parse({ success: true })

      res.status(200).json(response)
    } catch (error) {
      logger.error(
        "UserCategoryRuleDeleteController: Failed to delete user category rule",
        error instanceof Error ? error : new Error("Unknown error")
      )
      const errorResponse: ErrorResponse = {
        error: error instanceof Error ? error.message : "Failed to delete user category rule",
        status_code: 500,
      }
      res.status(500).json(errorResponse)
    }
  }
}
