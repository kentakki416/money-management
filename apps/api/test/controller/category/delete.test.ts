import request from "supertest"

import { CategoryDeleteController } from "../../../src/controller/category/delete"
import { PrismaCategoryRepository } from "../../../src/repository/mysql/category-repository"
import { categoryRouter } from "../../../src/routes/category-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, testPrisma } from "../setup"

const categoryRepository = new PrismaCategoryRepository(testPrisma)

const app = createTestApp()

app.use("/api/categories", categoryRouter({ delete: new CategoryDeleteController(categoryRepository) }))

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
})

describe("DELETE /api/categories/:id", () => {
  it("200 と削除成功メッセージを返す", async () => {
    const { token } = await createTestUser()

    const category = await testPrisma.category.create({
      data: { color: "#FF0000", name: "食費", sortOrder: 1 },
    })

    const res = await request(app).delete(`/api/categories/${category.id}`).set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.message).toBe("Category deleted successfully")

    // DBから実際に削除されていることを確認
    const deleted = await testPrisma.category.findUnique({ where: { id: category.id } })
    expect(deleted).toBeNull()
  })

  it("カテゴリが存在しない場合、404 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app).delete("/api/categories/999999").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(404)
    expect(res.body.error).toBe("Category not found")
  })

  it("無効なID形式の場合、400 を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app).delete("/api/categories/abc").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("Invalid category ID")
  })
})
