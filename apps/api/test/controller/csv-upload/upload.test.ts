import request from "supertest"

import { CsvUploadController } from "../../../src/controller/csv-upload/upload"
import { PrismaCategoryRuleRepository } from "../../../src/repository/mysql/category-rule-repository"
import { PrismaCsvUploadRepository } from "../../../src/repository/mysql/csv-upload-repository"
import { PrismaPaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { PrismaTransactionRepository } from "../../../src/repository/mysql/transaction-repository"
import { PrismaUserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { csvUploadRouter } from "../../../src/routes/csv-upload-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const transactionRepository = new PrismaTransactionRepository(testPrisma)
const csvUploadRepository = new PrismaCsvUploadRepository(testPrisma)
const paymentSourceRepository = new PrismaPaymentSourceRepository(testPrisma)
const categoryRuleRepository = new PrismaCategoryRuleRepository(testPrisma)
const userCategoryRuleRepository = new PrismaUserCategoryRuleRepository(testPrisma)

const app = createTestApp()

app.use(
  "/api/csv-uploads",
  csvUploadRouter({
    upload: new CsvUploadController(
      transactionRepository,
      csvUploadRepository,
      paymentSourceRepository,
      categoryRuleRepository,
      userCategoryRuleRepository
    ),
  })
)

const SAMPLE_CSV_A = "2026/04/01,テスト店舗A,1000,1,1,1000,\n2026/04/02,テスト店舗B,2000,1,1,2000,\n"
const SAMPLE_CSV_B = "2026/04/03,別の店舗,3000,1,1,3000,\n"

beforeEach(async () => {
  await cleanupTestData()
  /**
   * 自動分類のフォールバック先となる未分類カテゴリを事前にシード
   */
  await testPrisma.category.create({
    data: { color: "#CCCCCC", id: 99, name: "未分類", sortOrder: 99 },
  })
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("POST /api/csv-uploads", () => {
  it("201 と登録件数を返す（正常アップロード）", async () => {
    const { token, user } = await createTestUser()
    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    const res = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("payment_source_id", String(paymentSource.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_A), "statement.csv")

    expect(res.status).toBe(201)
    expect(res.body.imported_count).toBeGreaterThan(0)
  })

  it("同名のファイルを再度アップロードすると 4xx (409) を返す", async () => {
    const { token, user } = await createTestUser()
    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    /**
     * 1回目: 正常にアップロードできる
     */
    const first = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("payment_source_id", String(paymentSource.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_A), "statement.csv")

    expect(first.status).toBe(201)

    /**
     * 2回目: 内容が違っても「同じファイル名」なら拒否される
     * メッセージ本文は検証せず、4xx (409) が返ることのみ検証
     */
    const second = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("payment_source_id", String(paymentSource.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_B), "statement.csv")

    expect(second.status).toBe(409)
    expect(second.status).toBeGreaterThanOrEqual(400)
    expect(second.status).toBeLessThan(500)
    expect(second.body.error).toBeDefined()
    expect(second.body.status_code).toBe(409)
  })

  it("同じ内容（ハッシュ重複）のファイルを異なるファイル名でアップロードすると 4xx (409) を返す", async () => {
    const { token, user } = await createTestUser()
    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    const first = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("payment_source_id", String(paymentSource.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_A), "first.csv")

    expect(first.status).toBe(201)

    const second = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("payment_source_id", String(paymentSource.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_A), "second.csv")

    expect(second.status).toBe(409)
    expect(second.body.status_code).toBe(409)
  })

  it("異なるユーザー間なら同じファイル名でもアップロードできる", async () => {
    const { token: tokenA, user: userA } = await createTestUser({
      email: `user-a-${Date.now()}@example.com`,
    })
    const paymentSourceA = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: userA.id },
    })

    const resA = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${tokenA}`)
      .field("payment_source_id", String(paymentSourceA.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_A), "statement.csv")

    expect(resA.status).toBe(201)

    /**
     * 別ユーザーで同じファイル名（かつ別内容）をアップロード
     */
    const { token: tokenB, user: userB } = await createTestUser({
      email: `user-b-${Date.now()}@example.com`,
    })
    const paymentSourceB = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: userB.id },
    })

    const resB = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${tokenB}`)
      .field("payment_source_id", String(paymentSourceB.id))
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_B), "statement.csv")

    expect(resB.status).toBe(201)
  })

  it("ファイルが添付されていない場合、400 を返す", async () => {
    const { token, user } = await createTestUser()
    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "SMBCカード", type: "SMBC", userId: user.id },
    })

    const res = await request(app)
      .post("/api/csv-uploads")
      .set("Authorization", `Bearer ${token}`)
      .field("payment_source_id", String(paymentSource.id))
      .field("payment_source_type", "SMBC")

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it("認証なしの場合、401 を返す", async () => {
    const res = await request(app)
      .post("/api/csv-uploads")
      .field("payment_source_id", "1")
      .field("payment_source_type", "SMBC")
      .attach("file", Buffer.from(SAMPLE_CSV_A), "statement.csv")

    expect(res.status).toBe(401)
  })
})
