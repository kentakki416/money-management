import request from "supertest"

import { PaymentSourceDeleteController } from "../../../src/controller/payment-source/delete"
import { PrismaPaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { paymentSourceRouter } from "../../../src/routes/payment-source-router"
import { attachErrorHandler, createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const paymentSourceRepository = new PrismaPaymentSourceRepository(testPrisma)

const app = createTestApp()

app.use("/api/payment-sources", paymentSourceRouter({ delete: new PaymentSourceDeleteController(paymentSourceRepository) }))
attachErrorHandler(app)

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("DELETE /api/payment-sources/:id", () => {
  it("200 と削除成功レスポンスを返す", async () => {
    const { token, user } = await createTestUser()

    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    const res = await request(app)
      .delete(`/api/payment-sources/${paymentSource.id}`)
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)

    // DBから実際に削除されていることを確認
    const deleted = await testPrisma.paymentSource.findUnique({ where: { id: paymentSource.id } })
    expect(deleted).toBeNull()
  })

  it("無効なID形式の場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .delete("/api/payment-sources/abc")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it("認証なしの場合、401 を返す", async () => {
    const res = await request(app).delete("/api/payment-sources/1")

    expect(res.status).toBe(401)
  })
})
