import request from "supertest"

import { CategoryListController } from "../../../src/controller/category/list"
import { PrismaCategoryRepository } from "../../../src/repository/mysql/category-repository"
import { categoryRouter } from "../../../src/routes/category-router"
import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, disconnectTestDb, disconnectTestRedis, testPrisma } from "../setup"

const categoryRepository = new PrismaCategoryRepository(testPrisma)

const app = createTestApp()

app.use("/api/categories", categoryRouter({ list: new CategoryListController(categoryRepository) }))

beforeEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await cleanupTestData()
  await disconnectTestDb()
  await disconnectTestRedis()
})

describe("GET /api/categories", () => {
  it("200 とカテゴリ一覧を返す", async () => {
    const { token } = await createTestUser()

    await testPrisma.category.createMany({
      data: [
        { color: "#FF0000", name: "食費", sortOrder: 1 },
        { color: "#00FF00", name: "交通費", sortOrder: 2 },
      ],
    })

    const res = await request(app).get("/api/categories").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(2)
    expect(res.body.categories[0].name).toBe("食費")
    expect(res.body.categories[1].name).toBe("交通費")
  })

  it("カテゴリが存在しない場合、200 と空配列を返す", async () => {
    const { token } = await createTestUser()

    const res = await request(app).get("/api/categories").set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.categories).toEqual([])
  })
})
