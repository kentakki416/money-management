import { Router } from "express"

import { TransactionCreateController } from "../controller/transaction/create"
import { TransactionDeleteController } from "../controller/transaction/delete"
import { TransactionListController } from "../controller/transaction/list"
import { TransactionUpdateController } from "../controller/transaction/update"

type TransactionRouterControllers = {
  create?: TransactionCreateController
  delete?: TransactionDeleteController
  list?: TransactionListController
  update?: TransactionUpdateController
}

/**
 * 取引関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const transactionRouter = (controllers: TransactionRouterControllers): Router => {
  const router = Router()

  // GET /api/transactions
  if (controllers.list) {
    const controller = controllers.list
    router.get("/", async (req, res) => controller.execute(req, res))
  }

  // POST /api/transactions
  if (controllers.create) {
    const controller = controllers.create
    router.post("/", async (req, res) => controller.execute(req, res))
  }

  // PUT /api/transactions/:id
  if (controllers.update) {
    const controller = controllers.update
    router.put("/:id", async (req, res) => controller.execute(req, res))
  }

  // DELETE /api/transactions/:id
  if (controllers.delete) {
    const controller = controllers.delete
    router.delete("/:id", async (req, res) => controller.execute(req, res))
  }

  return router
}
