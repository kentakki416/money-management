import request from "supertest"

import { CategoryCreateController } from "../../../src/controller/category/create"
import { PrismaCategoryRepository } from "../../../src/repository/mysql/category-repository"
import { categoryRouter } from "../../../src/routes/category-router"
import { attachErrorHandler, createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, disconnectTestRedis, testPrisma } from "../setup"

const categoryRepository = new PrismaCategoryRepository(testPrisma)

const app = createTestApp()

app.use("/api/categories", categoryRouter({ create: new CategoryCreateController(categoryRepository) }))
attachErrorHandler(app)

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
  await disconnectTestRedis()
})

describe("POST /api/categories", () => {
  it("201 と作成されたカテゴリを返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#FF0000", name: "食費", sort_order: 1 })

    expect(res.status).toBe(201)
    expect(res.body.category.name).toBe("食費")
    expect(res.body.category.color).toBe("#FF0000")
    expect(res.body.category.sort_order).toBe(1)
    expect(res.body.category.id).toBeDefined()

    // DBに実際に保存されていることを確認
    const category = await testPrisma.category.findUnique({ where: { id: res.body.category.id } })
    expect(category).not.toBeNull()
    expect(category!.name).toBe("食費")
  })

  it("sort_order を省略しても 201 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#00FF00", name: "交通費" })

    expect(res.status).toBe(201)
    expect(res.body.category.name).toBe("交通費")
    expect(res.body.category.id).toBeDefined()
  })

  it("リクエストボディが不正な場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })

  it("name が空の場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .post("/api/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#FF0000", name: "" })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})
