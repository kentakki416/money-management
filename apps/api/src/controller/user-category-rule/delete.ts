import { Response } from "express"

import { deleteUserCategoryRulePathParamSchema, deleteUserCategoryRuleResponseSchema, ErrorResponse } from "@repo/api-schema"

import { AuthRequest } from "../../middleware/auth"
import { UserCategoryRuleRepository } from "../../repository/mysql"
import * as service from "../../service"

/**
 * ユーザー個別分類ルール削除API
 */
export class UserCategoryRuleDeleteController {
  constructor(private userCategoryRuleRepository: UserCategoryRuleRepository) {}

  async execute(req: AuthRequest, res: Response) {
    const { id } = deleteUserCategoryRulePathParamSchema.parse(req.params)
    const userId = req.userId!

    const result = await service.userCategoryRule.deleteUserCategoryRule(
      id,
      userId,
      this.userCategoryRuleRepository
    )

    if (!result.ok) {
      const errorResponse: ErrorResponse = {
        error: result.error.message,
        status_code: result.error.statusCode,
      }
      return res.status(result.error.statusCode).json(errorResponse)
    }

    const response = deleteUserCategoryRuleResponseSchema.parse({ success: true })
    return res.status(200).json(response)
  }
}
