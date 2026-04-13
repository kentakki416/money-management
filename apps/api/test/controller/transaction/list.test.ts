import request from "supertest"

import { TransactionListController } from "../../../src/controller/transaction/list"
import { PrismaTransactionRepository } from "../../../src/repository/mysql/transaction-repository"
import { transactionRouter } from "../../../src/routes/transaction-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const transactionRepository = new PrismaTransactionRepository(testPrisma)

const app = createTestApp()

app.use("/api/transactions", transactionRouter({ list: new TransactionListController(transactionRepository) }))

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("GET /api/transactions", () => {
  it("200 と取引一覧を返す", async () => {
    const { token, user } = await createTestUser()

    const category = await testPrisma.category.create({
      data: { color: "#FF0000", name: "食費", sortOrder: 1 },
    })

    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    await testPrisma.transaction.createMany({
      data: [
        {
          amount: 1000,
          categoryId: category.id,
          description: "ランチ",
          isManual: true,
          paymentSourceId: paymentSource.id,
          transactionDate: new Date("2026-04-01"),
          userId: user.id,
        },
        {
          amount: 2000,
          categoryId: category.id,
          description: "夕食",
          isManual: true,
          paymentSourceId: paymentSource.id,
          transactionDate: new Date("2026-04-02"),
          userId: user.id,
        },
      ],
    })

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({ month: 4, year: 2026 })

    expect(res.status).toBe(200)
    expect(res.body.transactions).toHaveLength(2)
    expect(res.body.total_amount).toBe(3000)
  })

  it("year/month フィルターで絞り込まれた取引を返す", async () => {
    const { token, user } = await createTestUser()

    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    await testPrisma.transaction.createMany({
      data: [
        {
          amount: 1000,
          description: "4月の取引",
          isManual: true,
          paymentSourceId: paymentSource.id,
          transactionDate: new Date("2026-04-01"),
          userId: user.id,
        },
        {
          amount: 5000,
          description: "5月の取引",
          isManual: true,
          paymentSourceId: paymentSource.id,
          transactionDate: new Date("2026-05-01"),
          userId: user.id,
        },
      ],
    })

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({ month: 4, year: 2026 })

    expect(res.status).toBe(200)
    expect(res.body.transactions).toHaveLength(1)
    expect(res.body.transactions[0].description).toBe("4月の取引")
  })

  it("他のユーザーの取引は返さない", async () => {
    const { token, user } = await createTestUser()
    const { user: otherUser } = await createTestUser({ email: "other@example.com" })

    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    const otherPaymentSource = await testPrisma.paymentSource.create({
      data: { name: "他ユーザーカード", type: "SMBC", userId: otherUser.id },
    })

    await testPrisma.transaction.create({
      data: {
        amount: 9999,
        description: "他ユーザーの取引",
        isManual: true,
        paymentSourceId: otherPaymentSource.id,
        transactionDate: new Date("2026-04-01"),
        userId: otherUser.id,
      },
    })

    await testPrisma.transaction.create({
      data: {
        amount: 1000,
        description: "自分の取引",
        isManual: true,
        paymentSourceId: paymentSource.id,
        transactionDate: new Date("2026-04-01"),
        userId: user.id,
      },
    })

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({ month: 4, year: 2026 })

    expect(res.status).toBe(200)
    expect(res.body.transactions).toHaveLength(1)
    expect(res.body.transactions[0].description).toBe("自分の取引")
  })

  it("取引が存在しない場合、200 と空配列を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .query({ month: 4, year: 2026 })

    expect(res.status).toBe(200)
    expect(res.body.transactions).toEqual([])
    expect(res.body.total_amount).toBe(0)
  })

  it("認証なしの場合、401 を返す", async () => {
    const res = await request(app).get("/api/transactions")

    expect(res.status).toBe(401)
  })
})
