import request from "supertest"

import { PaymentSourceListController } from "../../../src/controller/payment-source/list"
import { PrismaPaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { paymentSourceRouter } from "../../../src/routes/payment-source-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const paymentSourceRepository = new PrismaPaymentSourceRepository(testPrisma)

const app = createTestApp()

app.use("/api/payment-sources", paymentSourceRouter({ list: new PaymentSourceListController(paymentSourceRepository) }))

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("GET /api/payment-sources", () => {
  it("200 と支払い元一覧を返す", async () => {
    const { token, user } = await createTestUser()

    await testPrisma.paymentSource.createMany({
      data: [
        { name: "SMBCカード", type: "SMBC", userId: user.id },
        { name: "PayPay", type: "PAYPAY", userId: user.id },
      ],
    })

    const res = await request(app)
      .get("/api/payment-sources")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.payment_sources).toHaveLength(2)
  })

  it("他のユーザーの支払い元は返さない", async () => {
    const { token, user } = await createTestUser()
    const { user: otherUser } = await createTestUser({ email: "other@example.com" })

    await testPrisma.paymentSource.create({
      data: { name: "他ユーザーのカード", type: "SMBC", userId: otherUser.id },
    })

    await testPrisma.paymentSource.create({
      data: { name: "自分のカード", type: "MUFG", userId: user.id },
    })

    const res = await request(app)
      .get("/api/payment-sources")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.payment_sources).toHaveLength(1)
    expect(res.body.payment_sources[0].name).toBe("自分のカード")
  })

  it("支払い元が存在しない場合、200 と空配列を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .get("/api/payment-sources")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.payment_sources).toEqual([])
  })

  it("認証なしの場合、401 を返す", async () => {
    const res = await request(app).get("/api/payment-sources")

    expect(res.status).toBe(401)
  })
})
