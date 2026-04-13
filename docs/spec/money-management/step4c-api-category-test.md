# Step4c: API - カテゴリ関連テスト

カテゴリ・自動分類ルール・ユーザー個別分類ルールの Service ユニットテストと Controller インテグレーションテストを実装する。

## 対応内容

### 1. カテゴリ Service テスト

既存の `test/service/memo-service/` と同一パターンで、Repository をモックしてテストする。

`test/service/category-service/getAllCategories.test.ts`:

```typescript
import { CategoryRepository } from "@/repository/mysql"
import { getAllCategories } from "@/service/category-service"
import { Category } from "@/types/domain"

const mockFindAll = jest.fn<Promise<Category[]>, []>()

const mockCategoryRepository: CategoryRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: mockFindAll,
  findById: jest.fn(),
  update: jest.fn(),
}

describe("getAllCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリ一覧を返す", async () => {
    const mockCategories: Category[] = [
      { id: 1, color: "#FF6384", name: "飲食", sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, color: "#36A2EB", name: "交通", sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
    ]
    mockFindAll.mockResolvedValue(mockCategories)

    const result = await getAllCategories(mockCategoryRepository)

    expect(result).toEqual(mockCategories)
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("カテゴリが0件の場合は空配列を返す", async () => {
    mockFindAll.mockResolvedValue([])

    const result = await getAllCategories(mockCategoryRepository)

    expect(result).toEqual([])
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })
})
```

`test/service/category-service/createCategory.test.ts`:

```typescript
import { CategoryRepository, CreateCategoryInput } from "@/repository/mysql"
import { createCategory } from "@/service/category-service"
import { Category } from "@/types/domain"

const mockCreate = jest.fn<Promise<Category>, [CreateCategoryInput]>()

const mockCategoryRepository: CategoryRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}

describe("createCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリを作成して返す", async () => {
    const input: CreateCategoryInput = { color: "#FF0000", name: "テスト" }
    const mockCategory: Category = {
      id: 1, color: "#FF0000", name: "テスト", sortOrder: 0,
      createdAt: new Date(), updatedAt: new Date(),
    }
    mockCreate.mockResolvedValue(mockCategory)

    const result = await createCategory(input, mockCategoryRepository)

    expect(result).toEqual(mockCategory)
    expect(mockCreate).toHaveBeenCalledWith(input)
  })
})
```

`test/service/category-service/updateCategory.test.ts`:

```typescript
import { CategoryRepository, UpdateCategoryInput } from "@/repository/mysql"
import { updateCategory } from "@/service/category-service"
import { Category } from "@/types/domain"

const mockFindById = jest.fn<Promise<Category | null>, [number]>()
const mockUpdate = jest.fn<Promise<Category>, [number, UpdateCategoryInput]>()

const mockCategoryRepository: CategoryRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: mockFindById,
  update: mockUpdate,
}

describe("updateCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("存在するカテゴリを更新して返す", async () => {
    const existing: Category = {
      id: 1, color: "#FF6384", name: "飲食", sortOrder: 1,
      createdAt: new Date(), updatedAt: new Date(),
    }
    const updated: Category = { ...existing, name: "飲食費" }
    mockFindById.mockResolvedValue(existing)
    mockUpdate.mockResolvedValue(updated)

    const result = await updateCategory(1, { name: "飲食費" }, mockCategoryRepository)

    expect(result).toEqual(updated)
    expect(mockFindById).toHaveBeenCalledWith(1)
    expect(mockUpdate).toHaveBeenCalledWith(1, { name: "飲食費" })
  })

  it("存在しないカテゴリの場合はnullを返す", async () => {
    mockFindById.mockResolvedValue(null)

    const result = await updateCategory(999, { name: "テスト" }, mockCategoryRepository)

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
```

`test/service/category-service/deleteCategory.test.ts`:

```typescript
import { CategoryRepository } from "@/repository/mysql"
import { deleteCategory } from "@/service/category-service"
import { Category } from "@/types/domain"

const mockFindById = jest.fn<Promise<Category | null>, [number]>()
const mockDeleteById = jest.fn<Promise<void>, [number]>()

const mockCategoryRepository: CategoryRepository = {
  create: jest.fn(),
  deleteById: mockDeleteById,
  findAll: jest.fn(),
  findById: mockFindById,
  update: jest.fn(),
}

describe("deleteCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("存在するカテゴリを削除してtrueを返す", async () => {
    const existing: Category = {
      id: 1, color: "#FF6384", name: "飲食", sortOrder: 1,
      createdAt: new Date(), updatedAt: new Date(),
    }
    mockFindById.mockResolvedValue(existing)
    mockDeleteById.mockResolvedValue()

    const result = await deleteCategory(1, mockCategoryRepository)

    expect(result).toBe(true)
    expect(mockDeleteById).toHaveBeenCalledWith(1)
  })

  it("存在しないカテゴリの場合はfalseを返す", async () => {
    mockFindById.mockResolvedValue(null)

    const result = await deleteCategory(999, mockCategoryRepository)

    expect(result).toBe(false)
    expect(mockDeleteById).not.toHaveBeenCalled()
  })
})
```

### 2. カテゴリルール Service テスト

同一パターンで `test/service/category-rule-service/` に以下を作成:

- `getAllCategoryRules.test.ts` — ルール一覧取得
- `createCategoryRule.test.ts` — ルール作成
- `updateCategoryRule.test.ts` — ルール更新
- `deleteCategoryRule.test.ts` — ルール削除

### 3. ユーザー個別分類ルール Service テスト

`test/service/user-category-rule-service/` に以下を作成:

- `getUserCategoryRules.test.ts` — ユーザールール一覧取得
- `createUserCategoryRule.test.ts` — ユーザールール作成
- `updateUserCategoryRule.test.ts` — ユーザールール更新
- `deleteUserCategoryRule.test.ts` — ユーザールール削除
- `upsertUserCategoryRuleByKeyword.test.ts` — upsert（既存あり/なしの2パターン）

### 4. カテゴリ Controller テスト

既存の `test/controller/memo/` と同一パターンで、テスト用DBを使ったインテグレーションテスト。

`test/controller/category/list.test.ts`:

```typescript
import request from "supertest"

import { CategoryListController } from "@/controller/category/list"
import { PrismaCategoryRepository } from "@/repository/mysql"
import { categoryRouter } from "@/routes/category-router"

import { createTestApp } from "../helper"
import { cleanupTestData, testPrisma } from "../setup"

const categoryRepository = new PrismaCategoryRepository(testPrisma)
const app = createTestApp()
app.use(
  "/api/categories",
  categoryRouter({
    list: new CategoryListController(categoryRepository),
  })
)

describe("GET /api/categories", () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  it("カテゴリ一覧を取得できる", async () => {
    await testPrisma.category.createMany({
      data: [
        { id: 1, color: "#FF6384", name: "飲食", sortOrder: 1 },
        { id: 2, color: "#36A2EB", name: "交通", sortOrder: 2 },
      ],
    })

    const res = await request(app).get("/api/categories")

    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(2)
    expect(res.body.categories[0].name).toBe("飲食")
    expect(res.body.categories[1].name).toBe("交通")
  })

  it("カテゴリが0件の場合は空配列を返す", async () => {
    const res = await request(app).get("/api/categories")

    expect(res.status).toBe(200)
    expect(res.body.categories).toHaveLength(0)
  })
})
```

同一パターンで `test/controller/category/create.test.ts`, `update.test.ts`, `delete.test.ts` も作成する。

### 5. カテゴリルール Controller テスト

`test/controller/category-rule/` に list, create, update, delete のテストを作成する。テスト前にカテゴリのマスターデータをseedする。

### 6. ユーザー個別分類ルール Controller テスト

`test/controller/user-category-rule/` に list, create, update, delete のテストを作成する。認証が必要なため `createTestUser()` でトークンを取得して `Authorization` ヘッダーを付与する。

## 動作確認

### テスト実行

```bash
cd apps/api

# カテゴリ Service テスト
pnpm test -- --testPathPatterns="category-service"

# カテゴリルール Service テスト
pnpm test -- --testPathPatterns="category-rule-service"

# ユーザー個別分類ルール Service テスト
pnpm test -- --testPathPatterns="user-category-rule-service"

# カテゴリ Controller テスト（要DB起動）
pnpm test -- --testPathPatterns="controller/category"

# 全テスト
pnpm test
```

全テストがパスすることを確認する。
