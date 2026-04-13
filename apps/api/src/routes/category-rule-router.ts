import { Router } from "express"

import { CategoryRuleCreateController } from "../controller/category-rule/create"
import { CategoryRuleDeleteController } from "../controller/category-rule/delete"
import { CategoryRuleListController } from "../controller/category-rule/list"
import { CategoryRuleUpdateController } from "../controller/category-rule/update"

type CategoryRuleRouterControllers = {
  create?: CategoryRuleCreateController
  delete?: CategoryRuleDeleteController
  list?: CategoryRuleListController
  update?: CategoryRuleUpdateController
}

/**
 * カテゴリルール関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const categoryRuleRouter = (controllers: CategoryRuleRouterControllers): Router => {
  const router = Router()

  // GET /api/category-rules
  if (controllers.list) {
    const controller = controllers.list
    router.get("/", async (req, res) => controller.execute(req, res))
  }

  // POST /api/category-rules
  if (controllers.create) {
    const controller = controllers.create
    router.post("/", async (req, res) => controller.execute(req, res))
  }

  // PUT /api/category-rules/:id
  if (controllers.update) {
    const controller = controllers.update
    router.put("/:id", async (req, res) => controller.execute(req, res))
  }

  // DELETE /api/category-rules/:id
  if (controllers.delete) {
    const controller = controllers.delete
    router.delete("/:id", async (req, res) => controller.execute(req, res))
  }

  return router
}
