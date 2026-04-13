import request from "supertest"

import { CategoryUpdateController } from "../../../src/controller/category/update"
import { PrismaCategoryRepository } from "../../../src/repository/mysql/category-repository"
import { categoryRouter } from "../../../src/routes/category-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const categoryRepository = new PrismaCategoryRepository(testPrisma)

const app = createTestApp()

app.use("/api/categories", categoryRouter({ update: new CategoryUpdateController(categoryRepository) }))

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("PUT /api/categories/:id", () => {
  it("200 と更新されたカテゴリを返す", async () => {
    const { token } = await createTestUser()

    const category = await testPrisma.category.create({
      data: { color: "#FF0000", name: "食費", sortOrder: 1 },
    })

    const res = await request(app)
      .put(`/api/categories/${category.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#0000FF", name: "外食費", sort_order: 2 })

    expect(res.status).toBe(200)
    expect(res.body.category.id).toBe(category.id)
    expect(res.body.category.name).toBe("外食費")
    expect(res.body.category.color).toBe("#0000FF")
    expect(res.body.category.sort_order).toBe(2)
  })

  it("カテゴリが存在しない場合、404 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .put("/api/categories/999999")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#0000FF", name: "外食費" })

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("Category not found")
  })

  it("無効なID形式の場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .put("/api/categories/abc")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "#0000FF", name: "外食費" })

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Invalid category ID")
  })

  it("リクエストボディが不正な場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app)
      .put("/api/categories/1")
      .set("Authorization", `Bearer ${token}`)
      .send({ color: "invalid-color", name: "" })

    expect(res.status).toBe(400)
    expect(res.body.error).toBeDefined()
  })
})
