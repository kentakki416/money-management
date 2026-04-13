import { Router } from "express"

import { SummaryCalendarController } from "../controller/summary/calendar"
import { SummaryMonthlyController } from "../controller/summary/monthly"
import { SummaryTrendController } from "../controller/summary/trend"

type SummaryRouterControllers = {
  calendar?: SummaryCalendarController
  monthly?: SummaryMonthlyController
  trend?: SummaryTrendController
}

/**
 * 集計関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const summaryRouter = (controllers: SummaryRouterControllers): Router => {
  const router = Router()

  // GET /api/summary/monthly
  if (controllers.monthly) {
    const controller = controllers.monthly
    router.get("/monthly", async (req, res) => controller.execute(req, res))
  }

  // GET /api/summary/calendar
  if (controllers.calendar) {
    const controller = controllers.calendar
    router.get("/calendar", async (req, res) => controller.execute(req, res))
  }

  // GET /api/summary/trend
  if (controllers.trend) {
    const controller = controllers.trend
    router.get("/trend", async (req, res) => controller.execute(req, res))
  }

  return router
}
