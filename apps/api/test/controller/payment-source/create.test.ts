import request from "supertest"

import { PaymentSourceCreateController } from "../../../src/controller/payment-source/create"
import { PrismaPaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { paymentSourceRouter } from "../../../src/routes/payment-source-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const paymentSourceRepository = new PrismaPaymentSourceRepository(testPrisma)

const app = createTestApp()

app.use("/api/payment-sources", paymentSourceRouter({ create: new PaymentSourceCreateController(paymentSourceRepository) }))

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("POST /api/payment-sources", () => {
  it("201 と作成された支払い元を返す", async () => {
    const { token, user } = await createTestUser()

    const res = await request(app)
      .post("/api/payment-sources")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "SMBCカード", type: "SMBC" })

    expect(res.status).toBe(201)
    expect(res.body.payment_source.name).toBe("SMBCカード")
    expect(res.body.payment_source.type).toBe("SMBC")
    expect(res.body.payment_source.user_id).toBe(user.id)
    expect(res.body.payment_source.id).toBeDefined()

    // DBに実際に保存されていることを確認
    const paymentSource = await testPrisma.paymentSource.findUnique({ where: { id: res.body.payment_source.id } })
    expect(paymentSource).not.toBeNull()
    expect(paymentSource!.name).toBe("SMBCカード")
  })

  it("リクエストボディが不正な場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .post("/api/payment-sources")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it("認証なしの場合、401 を返す", async () => {
    const res = await request(app)
      .post("/api/payment-sources")
      .send({ name: "SMBCカード", type: "SMBC" })

    expect(res.status).toBe(401)
  })
})
