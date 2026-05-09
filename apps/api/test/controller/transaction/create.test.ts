import request from "supertest"

import { TransactionCreateController } from "../../../src/controller/transaction/create"
import { PrismaCategoryRuleRepository } from "../../../src/repository/mysql/category-rule-repository"
import { PrismaTransactionRepository } from "../../../src/repository/mysql/transaction-repository"
import { PrismaUserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { transactionRouter } from "../../../src/routes/transaction-router"
import { attachErrorHandler, createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, disconnectTestRedis, testPrisma } from "../setup"

const transactionRepository = new PrismaTransactionRepository(testPrisma)
const categoryRuleRepository = new PrismaCategoryRuleRepository(testPrisma)
const userCategoryRuleRepository = new PrismaUserCategoryRuleRepository(testPrisma)

const app = createTestApp()

app.use(
  "/api/transactions",
  transactionRouter({
    create: new TransactionCreateController(
      transactionRepository,
      categoryRuleRepository,
      userCategoryRuleRepository
    ),
  })
)
attachErrorHandler(app)

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
  await disconnectTestRedis()
})

describe("POST /api/transactions", () => {
  it("201 と作成された取引を返す（カテゴリあり）", async () => {
    const { token, user } = await createTestUser()

    const category = await testPrisma.category.create({
      data: { color: "#FF0000", name: "食費", sortOrder: 1 },
    })

    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1500,
        category_id: category.id,
        description: "ランチ",
        payment_source_id: paymentSource.id,
        transaction_date: "2026-04-10",
      })

    expect(res.status).toBe(201)
    expect(res.body.transaction.amount).toBe(1500)
    expect(res.body.transaction.description).toBe("ランチ")
    expect(res.body.transaction.category_id).toBe(category.id)
    expect(res.body.transaction.payment_source_id).toBe(paymentSource.id)
    expect(res.body.transaction.user_id).toBe(user.id)
    expect(res.body.transaction.is_manual).toBe(true)
    expect(res.body.transaction.id).toBeDefined()

    // DBに実際に保存されていることを確認
    const transaction = await testPrisma.transaction.findUnique({ where: { id: res.body.transaction.id } })
    expect(transaction).not.toBeNull()
    expect(transaction!.amount).toBe(1500)
  })

  it("201 と作成された取引を返す（カテゴリなし）", async () => {
    const { token, user } = await createTestUser()

    // 自動分類で未分類カテゴリ(id=99)が割り当てられるため、事前にシードする
    await testPrisma.category.create({
      data: { color: "#CCCCCC", id: 99, name: "未分類", sortOrder: 99 },
    })

    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "PayPay", type: "PAYPAY", userId: user.id },
    })

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 800,
        description: "コンビニ",
        payment_source_id: paymentSource.id,
        transaction_date: "2026-04-15",
      })

    expect(res.status).toBe(201)
    expect(res.body.transaction.amount).toBe(800)
    expect(res.body.transaction.category_id).toBe(99)
  })

  it("リクエストボディが不正な場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it("認証なしの場合、401 を返す", async () => {
    const res = await request(app)
      .post("/api/transactions")
      .send({
        amount: 1000,
        description: "テスト",
        payment_source_id: 1,
        transaction_date: "2026-04-10",
      })

    expect(res.status).toBe(401)
  })
})
