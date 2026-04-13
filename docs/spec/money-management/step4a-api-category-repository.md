# Step4a: API - カテゴリ関連 Repository

カテゴリ・自動分類ルール・ユーザー個別分類ルールのドメイン型定義と Repository を実装する。

## 対応内容

### 1. ドメイン型定義

`apps/api/src/types/domain/category.ts` を作成:

```typescript
export type Category = {
  id: number
  color: string
  name: string
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}
```

`apps/api/src/types/domain/category-rule.ts` を作成:

```typescript
export type CategoryRule = {
  id: number
  categoryId: number
  categoryName: string
  keyword: string
  matchType: "PARTIAL" | "EXACT"
  priority: number
  createdAt: Date
  updatedAt: Date
}
```

`apps/api/src/types/domain/user-category-rule.ts` を作成:

```typescript
export type UserCategoryRule = {
  id: number
  categoryId: number
  categoryName: string
  keyword: string
  matchType: "PARTIAL" | "EXACT"
  priority: number
  userId: number
  createdAt: Date
  updatedAt: Date
}
```

`apps/api/src/types/domain/index.ts` にエクスポート追加:

```typescript
export type { Category } from "./category"
export type { CategoryRule } from "./category-rule"
export type { UserCategoryRule } from "./user-category-rule"
```

### 2. カテゴリ Repository

`apps/api/src/repository/mysql/category-repository.ts` を作成:

```typescript
import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { Category } from "../../types/domain"

/**
 * カテゴリ作成時の入力
 */
export type CreateCategoryInput = {
  color: string
  name: string
  sortOrder?: number
}

/**
 * カテゴリ更新時の入力
 */
export type UpdateCategoryInput = {
  color?: string
  name?: string
  sortOrder?: number
}

/**
 * カテゴリリポジトリのインターフェース
 */
export interface CategoryRepository {
  create(data: CreateCategoryInput): Promise<Category>
  deleteById(id: number): Promise<void>
  findAll(): Promise<Category[]>
  findById(id: number): Promise<Category | null>
  update(id: number, data: UpdateCategoryInput): Promise<Category>
}

/**
 * Prisma実装のカテゴリリポジトリ
 */
export class PrismaCategoryRepository implements CategoryRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findAll(): Promise<Category[]> {
    const categories = await this._prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
    })
    return categories.map((c) => this._toDomain(c))
  }

  async findById(id: number): Promise<Category | null> {
    const category = await this._prisma.category.findUnique({ where: { id } })
    if (!category) return null
    return this._toDomain(category)
  }

  async create(data: CreateCategoryInput): Promise<Category> {
    const category = await this._prisma.category.create({
      data: {
        color: data.color,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    })
    return this._toDomain(category)
  }

  async update(id: number, data: UpdateCategoryInput): Promise<Category> {
    const category = await this._prisma.category.update({
      data: {
        color: data.color,
        name: data.name,
        sortOrder: data.sortOrder,
      },
      where: { id },
    })
    return this._toDomain(category)
  }

  async deleteById(id: number): Promise<void> {
    await this._prisma.category.delete({ where: { id } })
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(prismaCategory: PrismaTypes.CategoryGetPayload<{}>): Category {
    return {
      id: prismaCategory.id,
      color: prismaCategory.color,
      name: prismaCategory.name,
      sortOrder: prismaCategory.sortOrder,
      createdAt: prismaCategory.createdAt,
      updatedAt: prismaCategory.updatedAt,
    }
  }
}
```

### 3. カテゴリルール Repository

`apps/api/src/repository/mysql/category-rule-repository.ts` を作成:

```typescript
import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { CategoryRule } from "../../types/domain"

/**
 * カテゴリルール作成時の入力
 */
export type CreateCategoryRuleInput = {
  categoryId: number
  keyword: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * カテゴリルール更新時の入力
 */
export type UpdateCategoryRuleInput = {
  categoryId?: number
  keyword?: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * カテゴリルールリポジトリのインターフェース
 */
export interface CategoryRuleRepository {
  create(data: CreateCategoryRuleInput): Promise<CategoryRule>
  deleteById(id: number): Promise<void>
  findAll(): Promise<CategoryRule[]>
  update(id: number, data: UpdateCategoryRuleInput): Promise<CategoryRule>
}

type CategoryRuleWithCategory = PrismaTypes.CategoryRuleGetPayload<{
  include: { category: true }
}>

/**
 * Prisma実装のカテゴリルールリポジトリ
 */
export class PrismaCategoryRuleRepository implements CategoryRuleRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findAll(): Promise<CategoryRule[]> {
    const rules = await this._prisma.categoryRule.findMany({
      include: { category: true },
      orderBy: { priority: "desc" },
    })
    return rules.map((r) => this._toDomain(r))
  }

  async create(data: CreateCategoryRuleInput): Promise<CategoryRule> {
    const rule = await this._prisma.categoryRule.create({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType ?? "PARTIAL",
        priority: data.priority ?? 0,
      },
      include: { category: true },
    })
    return this._toDomain(rule)
  }

  async update(id: number, data: UpdateCategoryRuleInput): Promise<CategoryRule> {
    const rule = await this._prisma.categoryRule.update({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType,
        priority: data.priority,
      },
      include: { category: true },
      where: { id },
    })
    return this._toDomain(rule)
  }

  async deleteById(id: number): Promise<void> {
    await this._prisma.categoryRule.delete({ where: { id } })
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(rule: CategoryRuleWithCategory): CategoryRule {
    return {
      id: rule.id,
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      keyword: rule.keyword,
      matchType: rule.matchType as "PARTIAL" | "EXACT",
      priority: rule.priority,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }
  }
}
```

### 4. ユーザー個別分類ルール Repository

`apps/api/src/repository/mysql/user-category-rule-repository.ts` を作成:

```typescript
import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { UserCategoryRule } from "../../types/domain"

/**
 * ユーザールール作成時の入力
 */
export type CreateUserCategoryRuleInput = {
  categoryId: number
  keyword: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * ユーザールール更新時の入力
 */
export type UpdateUserCategoryRuleInput = {
  categoryId?: number
  keyword?: string
  matchType?: "PARTIAL" | "EXACT"
  priority?: number
}

/**
 * ユーザー個別分類ルールリポジトリのインターフェース
 */
export interface UserCategoryRuleRepository {
  create(userId: number, data: CreateUserCategoryRuleInput): Promise<UserCategoryRule>
  deleteById(id: number, userId: number): Promise<void>
  findByUserId(userId: number): Promise<UserCategoryRule[]>
  update(id: number, userId: number, data: UpdateUserCategoryRuleInput): Promise<UserCategoryRule>
  upsertByKeyword(userId: number, keyword: string, categoryId: number): Promise<UserCategoryRule>
}

type UserCategoryRuleWithCategory = PrismaTypes.UserCategoryRuleGetPayload<{
  include: { category: true }
}>

/**
 * Prisma実装のユーザー個別分類ルールリポジトリ
 */
export class PrismaUserCategoryRuleRepository implements UserCategoryRuleRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async findByUserId(userId: number): Promise<UserCategoryRule[]> {
    const rules = await this._prisma.userCategoryRule.findMany({
      include: { category: true },
      orderBy: { priority: "desc" },
      where: { userId },
    })
    return rules.map((r) => this._toDomain(r))
  }

  async create(userId: number, data: CreateUserCategoryRuleInput): Promise<UserCategoryRule> {
    const rule = await this._prisma.userCategoryRule.create({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType ?? "PARTIAL",
        priority: data.priority ?? 0,
        userId,
      },
      include: { category: true },
    })
    return this._toDomain(rule)
  }

  async update(id: number, userId: number, data: UpdateUserCategoryRuleInput): Promise<UserCategoryRule> {
    const rule = await this._prisma.userCategoryRule.update({
      data: {
        categoryId: data.categoryId,
        keyword: data.keyword,
        matchType: data.matchType,
        priority: data.priority,
      },
      include: { category: true },
      where: { id, userId },
    })
    return this._toDomain(rule)
  }

  async deleteById(id: number, userId: number): Promise<void> {
    await this._prisma.userCategoryRule.deleteMany({ where: { id, userId } })
  }

  /**
   * 同じユーザー・同じキーワードのルールがあれば更新、なければ作成
   * 取引のカテゴリ手動変更時に自動呼び出しされる
   */
  async upsertByKeyword(userId: number, keyword: string, categoryId: number): Promise<UserCategoryRule> {
    const rule = await this._prisma.userCategoryRule.upsert({
      create: {
        categoryId,
        keyword,
        matchType: "PARTIAL",
        priority: 0,
        userId,
      },
      include: { category: true },
      update: {
        categoryId,
      },
      where: {
        userId_keyword: {
          keyword,
          userId,
        },
      },
    })
    return this._toDomain(rule)
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(rule: UserCategoryRuleWithCategory): UserCategoryRule {
    return {
      id: rule.id,
      categoryId: rule.categoryId,
      categoryName: rule.category.name,
      keyword: rule.keyword,
      matchType: rule.matchType as "PARTIAL" | "EXACT",
      priority: rule.priority,
      userId: rule.userId,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    }
  }
}
```

### 5. Repository の index.ts にエクスポート追加

`apps/api/src/repository/mysql/index.ts` に追加:

```typescript
export * from "./category-repository"
export * from "./category-rule-repository"
export * from "./user-category-rule-repository"
```

## 動作確認

### ビルド確認

```bash
cd apps/api
pnpm build
```

エラーなくビルドが完了することを確認する。
