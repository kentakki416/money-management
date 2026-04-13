import { Router } from "express"

import { UserCategoryRuleCreateController } from "../controller/user-category-rule/create"
import { UserCategoryRuleDeleteController } from "../controller/user-category-rule/delete"
import { UserCategoryRuleListController } from "../controller/user-category-rule/list"
import { UserCategoryRuleUpdateController } from "../controller/user-category-rule/update"
import { AuthRequest } from "../middleware/auth"

type UserCategoryRuleRouterControllers = {
  create?: UserCategoryRuleCreateController
  delete?: UserCategoryRuleDeleteController
  list?: UserCategoryRuleListController
  update?: UserCategoryRuleUpdateController
}

/**
 * ユーザー個別分類ルール関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const userCategoryRuleRouter = (controllers: UserCategoryRuleRouterControllers): Router => {
  const router = Router()

  // GET /api/user-category-rules
  if (controllers.list) {
    const controller = controllers.list
    router.get("/", async (req, res) => controller.execute(req as AuthRequest, res))
  }

  // POST /api/user-category-rules
  if (controllers.create) {
    const controller = controllers.create
    router.post("/", async (req, res) => controller.execute(req as AuthRequest, res))
  }

  // PUT /api/user-category-rules/:id
  if (controllers.update) {
    const controller = controllers.update
    router.put("/:id", async (req, res) => controller.execute(req as AuthRequest, res))
  }

  // DELETE /api/user-category-rules/:id
  if (controllers.delete) {
    const controller = controllers.delete
    router.delete("/:id", async (req, res) => controller.execute(req as AuthRequest, res))
  }

  return router
}
