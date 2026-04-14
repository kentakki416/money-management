import { Router } from "express"

import { AdminCategoryCreateController } from "../controller/admin/category-create"
import { AdminCategoryDeleteController } from "../controller/admin/category-delete"
import { AdminCategoryListController } from "../controller/admin/category-list"
import { AdminCategoryRuleCreateController } from "../controller/admin/category-rule-create"
import { AdminCategoryRuleDeleteController } from "../controller/admin/category-rule-delete"
import { AdminCategoryRuleListController } from "../controller/admin/category-rule-list"
import { AdminCategoryRuleUpdateController } from "../controller/admin/category-rule-update"
import { AdminCategoryUpdateController } from "../controller/admin/category-update"
import { AdminStatsController } from "../controller/admin/stats"
import { AdminUserDetailController } from "../controller/admin/user-detail"
import { AdminUserListController } from "../controller/admin/user-list"

type AdminRouterControllers = {
  categoryCreate?: AdminCategoryCreateController
  categoryDelete?: AdminCategoryDeleteController
  categoryList?: AdminCategoryListController
  categoryRuleCreate?: AdminCategoryRuleCreateController
  categoryRuleDelete?: AdminCategoryRuleDeleteController
  categoryRuleList?: AdminCategoryRuleListController
  categoryRuleUpdate?: AdminCategoryRuleUpdateController
  categoryUpdate?: AdminCategoryUpdateController
  stats?: AdminStatsController
  userDetail?: AdminUserDetailController
  userList?: AdminUserListController
}

/**
 * Admin関連のルーター
 * すべてのAdmin APIを /api/admin/ 配下に統合する
 */
export const adminRouter = (controllers: AdminRouterControllers): Router => {
  const router = Router()

  /** GET /api/admin/stats */
  if (controllers.stats) {
    const ctrl = controllers.stats
    router.get("/stats", async (req, res) => ctrl.execute(req, res))
  }

  /** GET /api/admin/users */
  if (controllers.userList) {
    const ctrl = controllers.userList
    router.get("/users", async (req, res) => ctrl.execute(req, res))
  }

  /** GET /api/admin/users/:id */
  if (controllers.userDetail) {
    const ctrl = controllers.userDetail
    router.get("/users/:id", async (req, res) => ctrl.execute(req, res))
  }

  /** GET /api/admin/categories */
  if (controllers.categoryList) {
    const ctrl = controllers.categoryList
    router.get("/categories", async (req, res) => ctrl.execute(req, res))
  }

  /** POST /api/admin/categories */
  if (controllers.categoryCreate) {
    const ctrl = controllers.categoryCreate
    router.post("/categories", async (req, res) => ctrl.execute(req, res))
  }

  /** PUT /api/admin/categories/:id */
  if (controllers.categoryUpdate) {
    const ctrl = controllers.categoryUpdate
    router.put("/categories/:id", async (req, res) => ctrl.execute(req, res))
  }

  /** DELETE /api/admin/categories/:id */
  if (controllers.categoryDelete) {
    const ctrl = controllers.categoryDelete
    router.delete("/categories/:id", async (req, res) => ctrl.execute(req, res))
  }

  /** GET /api/admin/category-rules */
  if (controllers.categoryRuleList) {
    const ctrl = controllers.categoryRuleList
    router.get("/category-rules", async (req, res) => ctrl.execute(req, res))
  }

  /** POST /api/admin/category-rules */
  if (controllers.categoryRuleCreate) {
    const ctrl = controllers.categoryRuleCreate
    router.post("/category-rules", async (req, res) => ctrl.execute(req, res))
  }

  /** PUT /api/admin/category-rules/:id */
  if (controllers.categoryRuleUpdate) {
    const ctrl = controllers.categoryRuleUpdate
    router.put("/category-rules/:id", async (req, res) => ctrl.execute(req, res))
  }

  /** DELETE /api/admin/category-rules/:id */
  if (controllers.categoryRuleDelete) {
    const ctrl = controllers.categoryRuleDelete
    router.delete("/category-rules/:id", async (req, res) => ctrl.execute(req, res))
  }

  return router
}
