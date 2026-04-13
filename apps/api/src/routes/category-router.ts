import { Router } from "express"

import { CategoryCreateController } from "../controller/category/create"
import { CategoryDeleteController } from "../controller/category/delete"
import { CategoryListController } from "../controller/category/list"
import { CategoryUpdateController } from "../controller/category/update"

type CategoryRouterControllers = {
  create?: CategoryCreateController
  delete?: CategoryDeleteController
  list?: CategoryListController
  update?: CategoryUpdateController
}

/**
 * カテゴリ関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const categoryRouter = (controllers: CategoryRouterControllers): Router => {
  const router = Router()

  // GET /api/categories
  if (controllers.list) {
    const controller = controllers.list
    router.get("/", async (req, res) => controller.execute(req, res))
  }

  // POST /api/categories
  if (controllers.create) {
    const controller = controllers.create
    router.post("/", async (req, res) => controller.execute(req, res))
  }

  // PUT /api/categories/:id
  if (controllers.update) {
    const controller = controllers.update
    router.put("/:id", async (req, res) => controller.execute(req, res))
  }

  // DELETE /api/categories/:id
  if (controllers.delete) {
    const controller = controllers.delete
    router.delete("/:id", async (req, res) => controller.execute(req, res))
  }

  return router
}
