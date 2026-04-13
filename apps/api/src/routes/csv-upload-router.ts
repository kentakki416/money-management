import { Router } from "express"
import multer from "multer"

import { CsvUploadListController } from "../controller/csv-upload/list"
import { CsvUploadController } from "../controller/csv-upload/upload"

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage(),
})

type CsvUploadRouterControllers = {
  list?: CsvUploadListController
  upload?: CsvUploadController
}

/**
 * CSVアップロード関連のルーター
 * 渡されたコントローラーのルートのみ登録する
 */
export const csvUploadRouter = (controllers: CsvUploadRouterControllers): Router => {
  const router = Router()

  // GET /api/csv-uploads
  if (controllers.list) {
    const controller = controllers.list
    router.get("/", async (req, res) => controller.execute(req, res))
  }

  // POST /api/csv-uploads
  if (controllers.upload) {
    const controller = controllers.upload
    router.post("/", upload.single("file"), async (req, res) => controller.execute(req, res))
  }

  return router
}
