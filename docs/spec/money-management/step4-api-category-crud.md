# Step4: API - カテゴリ・自動分類ルール CRUD

カテゴリマスターと自動分類ルールのCRUD APIを実装する。

## 対応内容

### 1. カテゴリ Repository

`apps/api/src/repository/mysql/prisma-category-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated"

export type CategoryData = {
  color: string
  id: number
  name: string
  sortOrder: number
}

export type CreateCategoryInput = {
  color: string
  name: string
  sortOrder?: number
}

export type UpdateCategoryInput = {
  color?: string
  name?: string
  sortOrder?: number
}

export const createPrismaCategoryRepository = (prisma: PrismaClient) => ({
  create: async (input: CreateCategoryInput): Promise<CategoryData> => {
    const category = await prisma.category.create({
      data: {
        color: input.color,
        name: input.name,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    return {
      color: category.color,
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
    }
  },

  delete: async (id: number): Promise<void> => {
    await prisma.category.delete({ where: { id } })
  },

  findAll: async (): Promise<CategoryData[]> => {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return categories.map((c) => ({
      color: c.color,
      id: c.id,
      name: c.name,
      sortOrder: c.sortOrder,
    }))
  },

  findById: async (id: number): Promise<CategoryData | null> => {
    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return null
    return {
      color: category.color,
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
    }
  },

  update: async (id: number, input: UpdateCategoryInput): Promise<CategoryData> => {
    const category = await prisma.category.update({
      data: {
        color: input.color,
        name: input.name,
        sortOrder: input.sortOrder,
      },
      where: { id },
    })
    return {
      color: category.color,
      id: category.id,
      name: category.name,
      sortOrder: category.sortOrder,
    }
  },
})

export type PrismaCategoryRepository = ReturnType<typeof createPrismaCategoryRepository>
```

### 2. カテゴリルール Repository

`apps/api/src/repository/mysql/prisma-category-rule-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated"

export type CategoryRuleData = {
  categoryId: number
  categoryName?: string
  id: number
  keyword: string
  matchType: "PARTIAL" | "EXACT"
  priority: number
}

export type CreateCategoryRuleInput = {
  categoryId: number
  keyword: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

export type UpdateCategoryRuleInput = {
  categoryId?: number
  keyword?: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

export const createPrismaCategoryRuleRepository = (prisma: PrismaClient) => ({
  create: async (input: CreateCategoryRuleInput): Promise<CategoryRuleData> => {
    const rule = await prisma.categoryRule.create({
      data: {
        categoryId: input.categoryId,
        keyword: input.keyword,
        matchType: input.matchType ?? "PARTIAL",
        priority: input.priority ?? 0,
      },
      include: { category: true },
    })
    return {
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      id: rule.id,
      keyword: rule.keyword,
      matchType: rule.matchType as "PARTIAL" | "EXACT",
      priority: rule.priority,
    }
  },

  delete: async (id: number): Promise<void> => {
    await prisma.categoryRule.delete({ where: { id } })
  },

  findAll: async (): Promise<CategoryRuleData[]> => {
    const rules = await prisma.categoryRule.findMany({
      include: { category: true },
      orderBy: { priority: "desc" },
    })
    return rules.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.category.name,
      id: r.id,
      keyword: r.keyword,
      matchType: r.matchType as "PARTIAL" | "EXACT",
      priority: r.priority,
    }))
  },

  update: async (id: number, input: UpdateCategoryRuleInput): Promise<CategoryRuleData> => {
    const rule = await prisma.categoryRule.update({
      data: {
        categoryId: input.categoryId,
        keyword: input.keyword,
        matchType: input.matchType,
        priority: input.priority,
      },
      include: { category: true },
      where: { id },
    })
    return {
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      id: rule.id,
      keyword: rule.keyword,
      matchType: rule.matchType as "PARTIAL" | "EXACT",
      priority: rule.priority,
    }
  },
})

export type PrismaCategoryRuleRepository = ReturnType<typeof createPrismaCategoryRuleRepository>
```

### 3. カテゴリ Service

`apps/api/src/service/category-service.ts` を作成:

```typescript
import { PrismaCategoryRepository } from "../repository/mysql/prisma-category-repository"

export const createCategoryService = (repo: PrismaCategoryRepository) => ({
  createCategory: async (input: { color: string; name: string; sortOrder?: number }) => {
    return repo.create(input)
  },

  deleteCategory: async (id: number) => {
    return repo.delete(id)
  },

  getAllCategories: async () => {
    return repo.findAll()
  },

  updateCategory: async (id: number, input: { color?: string; name?: string; sortOrder?: number }) => {
    return repo.update(id, input)
  },
})

export type CategoryService = ReturnType<typeof createCategoryService>
```

### 4. カテゴリルール Service

`apps/api/src/service/category-rule-service.ts` を作成:

```typescript
import { PrismaCategoryRuleRepository } from "../repository/mysql/prisma-category-rule-repository"

export const createCategoryRuleService = (repo: PrismaCategoryRuleRepository) => ({
  createRule: async (input: {
    categoryId: number
    keyword: string
    matchType?: "PARTIAL" | "EXACT"
    priority?: number
  }) => {
    return repo.create(input)
  },

  deleteRule: async (id: number) => {
    return repo.delete(id)
  },

  getAllRules: async () => {
    return repo.findAll()
  },

  updateRule: async (id: number, input: {
    categoryId?: number
    keyword?: string
    matchType?: "PARTIAL" | "EXACT"
    priority?: number
  }) => {
    return repo.update(id, input)
  },
})

export type CategoryRuleService = ReturnType<typeof createCategoryRuleService>
```

### 5. カテゴリ Controller

`apps/api/src/controller/category/list.ts`:

```typescript
import { Request, Response } from "express"
import { getCategoryListResponseSchema } from "@repo/api-schema"
import { CategoryService } from "../../service/category-service"

export const createListCategoriesController = (service: CategoryService) =>
  async (_req: Request, res: Response) => {
    const categories = await service.getAllCategories()
    const response = getCategoryListResponseSchema.parse({
      categories: categories.map((c) => ({
        color: c.color,
        created_at: new Date().toISOString(),
        id: c.id,
        name: c.name,
        sort_order: c.sortOrder,
        updated_at: new Date().toISOString(),
      })),
    })
    res.json(response)
  }
```

`apps/api/src/controller/category/create.ts`:

```typescript
import { Request, Response } from "express"
import { createCategoryRequestSchema, createCategoryResponseSchema } from "@repo/api-schema"
import { CategoryService } from "../../service/category-service"

export const createCreateCategoryController = (service: CategoryService) =>
  async (req: Request, res: Response) => {
    const input = createCategoryRequestSchema.parse(req.body)
    const category = await service.createCategory({
      color: input.color,
      name: input.name,
      sortOrder: input.sort_order,
    })
    const response = createCategoryResponseSchema.parse({
      category: {
        color: category.color,
        created_at: new Date().toISOString(),
        id: category.id,
        name: category.name,
        sort_order: category.sortOrder,
        updated_at: new Date().toISOString(),
      },
    })
    res.status(201).json(response)
  }
```

`apps/api/src/controller/category/update.ts`:

```typescript
import { Request, Response } from "express"
import { updateCategoryRequestSchema, updateCategoryResponseSchema } from "@repo/api-schema"
import { CategoryService } from "../../service/category-service"

export const createUpdateCategoryController = (service: CategoryService) =>
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const input = updateCategoryRequestSchema.parse(req.body)
    const category = await service.updateCategory(id, {
      color: input.color,
      name: input.name,
      sortOrder: input.sort_order,
    })
    const response = updateCategoryResponseSchema.parse({
      category: {
        color: category.color,
        created_at: new Date().toISOString(),
        id: category.id,
        name: category.name,
        sort_order: category.sortOrder,
        updated_at: new Date().toISOString(),
      },
    })
    res.json(response)
  }
```

`apps/api/src/controller/category/delete.ts`:

```typescript
import { Request, Response } from "express"
import { CategoryService } from "../../service/category-service"

export const createDeleteCategoryController = (service: CategoryService) =>
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    await service.deleteCategory(id)
    res.json({ success: true })
  }
```

### 6. カテゴリルール Controller

同様のパターンで `apps/api/src/controller/category-rule/` に `list.ts`, `create.ts`, `update.ts`, `delete.ts` を作成する。構成はカテゴリコントローラーと同一パターン。

`apps/api/src/controller/category-rule/list.ts`:

```typescript
import { Request, Response } from "express"
import { getCategoryRuleListResponseSchema } from "@repo/api-schema"
import { CategoryRuleService } from "../../service/category-rule-service"

export const createListCategoryRulesController = (service: CategoryRuleService) =>
  async (_req: Request, res: Response) => {
    const rules = await service.getAllRules()
    const response = getCategoryRuleListResponseSchema.parse({
      rules: rules.map((r) => ({
        category_id: r.categoryId,
        category_name: r.categoryName,
        created_at: new Date().toISOString(),
        id: r.id,
        keyword: r.keyword,
        match_type: r.matchType,
        priority: r.priority,
        updated_at: new Date().toISOString(),
      })),
    })
    res.json(response)
  }
```

`apps/api/src/controller/category-rule/create.ts`:

```typescript
import { Request, Response } from "express"
import { createCategoryRuleRequestSchema, createCategoryRuleResponseSchema } from "@repo/api-schema"
import { CategoryRuleService } from "../../service/category-rule-service"

export const createCreateCategoryRuleController = (service: CategoryRuleService) =>
  async (req: Request, res: Response) => {
    const input = createCategoryRuleRequestSchema.parse(req.body)
    const rule = await service.createRule({
      categoryId: input.category_id,
      keyword: input.keyword,
      matchType: input.match_type,
      priority: input.priority,
    })
    const response = createCategoryRuleResponseSchema.parse({
      rule: {
        category_id: rule.categoryId,
        category_name: rule.categoryName,
        created_at: new Date().toISOString(),
        id: rule.id,
        keyword: rule.keyword,
        match_type: rule.matchType,
        priority: rule.priority,
        updated_at: new Date().toISOString(),
      },
    })
    res.status(201).json(response)
  }
```

`apps/api/src/controller/category-rule/update.ts`:

```typescript
import { Request, Response } from "express"
import { updateCategoryRuleRequestSchema, updateCategoryRuleResponseSchema } from "@repo/api-schema"
import { CategoryRuleService } from "../../service/category-rule-service"

export const createUpdateCategoryRuleController = (service: CategoryRuleService) =>
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    const input = updateCategoryRuleRequestSchema.parse(req.body)
    const rule = await service.updateRule(id, {
      categoryId: input.category_id,
      keyword: input.keyword,
      matchType: input.match_type,
      priority: input.priority,
    })
    const response = updateCategoryRuleResponseSchema.parse({
      rule: {
        category_id: rule.categoryId,
        category_name: rule.categoryName,
        created_at: new Date().toISOString(),
        id: rule.id,
        keyword: rule.keyword,
        match_type: rule.matchType,
        priority: rule.priority,
        updated_at: new Date().toISOString(),
      },
    })
    res.json(response)
  }
```

`apps/api/src/controller/category-rule/delete.ts`:

```typescript
import { Request, Response } from "express"
import { CategoryRuleService } from "../../service/category-rule-service"

export const createDeleteCategoryRuleController = (service: CategoryRuleService) =>
  async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10)
    await service.deleteRule(id)
    res.json({ success: true })
  }
```

### 7. ルーター登録

`apps/api/src/routes/category-router.ts`:

```typescript
import { Router } from "express"

import { createCreateCategoryController } from "../controller/category/create"
import { createDeleteCategoryController } from "../controller/category/delete"
import { createListCategoriesController } from "../controller/category/list"
import { createUpdateCategoryController } from "../controller/category/update"
import { CategoryService } from "../service/category-service"

export const createCategoryRouter = (service: CategoryService): Router => {
  const router = Router()

  router.get("/", createListCategoriesController(service))
  router.post("/", createCreateCategoryController(service))
  router.put("/:id", createUpdateCategoryController(service))
  router.delete("/:id", createDeleteCategoryController(service))

  return router
}
```

`apps/api/src/routes/category-rule-router.ts`:

```typescript
import { Router } from "express"

import { createCreateCategoryRuleController } from "../controller/category-rule/create"
import { createDeleteCategoryRuleController } from "../controller/category-rule/delete"
import { createListCategoryRulesController } from "../controller/category-rule/list"
import { createUpdateCategoryRuleController } from "../controller/category-rule/update"
import { CategoryRuleService } from "../service/category-rule-service"

export const createCategoryRuleRouter = (service: CategoryRuleService): Router => {
  const router = Router()

  router.get("/", createListCategoryRulesController(service))
  router.post("/", createCreateCategoryRuleController(service))
  router.put("/:id", createUpdateCategoryRuleController(service))
  router.delete("/:id", createDeleteCategoryRuleController(service))

  return router
}
```

### 8. index.ts にルート追加

`apps/api/src/index.ts` に以下を追加:

```typescript
import { createCategoryRouter } from "./routes/category-router"
import { createCategoryRuleRouter } from "./routes/category-rule-router"
import { createPrismaCategoryRepository } from "./repository/mysql/prisma-category-repository"
import { createPrismaCategoryRuleRepository } from "./repository/mysql/prisma-category-rule-repository"
import { createCategoryService } from "./service/category-service"
import { createCategoryRuleService } from "./service/category-rule-service"

// リポジトリ
const categoryRepo = createPrismaCategoryRepository(prisma)
const categoryRuleRepo = createPrismaCategoryRuleRepository(prisma)

// サービス
const categoryService = createCategoryService(categoryRepo)
const categoryRuleService = createCategoryRuleService(categoryRuleRepo)

// ルート登録
app.use("/api/categories", createCategoryRouter(categoryService))
app.use("/api/category-rules", createCategoryRuleRouter(categoryRuleService))
```

## 動作確認

### curlによるAPI確認

```bash
# カテゴリ一覧取得
curl http://localhost:8080/api/categories

# カテゴリ作成
curl -X POST http://localhost:8080/api/categories \
  -H "Content-Type: application/json" \
  -d '{"name":"テスト","color":"#FF0000","sort_order":50}'

# カテゴリ更新
curl -X PUT http://localhost:8080/api/categories/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"飲食費"}'

# カテゴリ削除
curl -X DELETE http://localhost:8080/api/categories/100

# ルール一覧取得
curl http://localhost:8080/api/category-rules

# ルール作成
curl -X POST http://localhost:8080/api/category-rules \
  -H "Content-Type: application/json" \
  -d '{"category_id":1,"keyword":"テスト店","match_type":"PARTIAL","priority":10}'
```

各APIが正常にレスポンスを返すことを確認する。
