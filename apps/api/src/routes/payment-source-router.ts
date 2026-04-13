import { Router } from "express"

import { PaymentSourceCreateController } from "../controller/payment-source/create"
import { PaymentSourceDeleteController } from "../controller/payment-source/delete"
import { PaymentSourceListController } from "../controller/payment-source/list"

type PaymentSourceRouterControllers = {
  create?: PaymentSourceCreateController
  delete?: PaymentSourceDeleteController
  list?: PaymentSourceListController
}

/**
 * 支払い元関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const paymentSourceRouter = (controllers: PaymentSourceRouterControllers): Router => {
  const router = Router()

  // GET /api/payment-sources
  if (controllers.list) {
    const controller = controllers.list
    router.get("/", async (req, res) => controller.execute(req, res))
  }

  // POST /api/payment-sources
  if (controllers.create) {
    const controller = controllers.create
    router.post("/", async (req, res) => controller.execute(req, res))
  }

  // DELETE /api/payment-sources/:id
  if (controllers.delete) {
    const controller = controllers.delete
    router.delete("/:id", async (req, res) => controller.execute(req, res))
  }

  return router
}
