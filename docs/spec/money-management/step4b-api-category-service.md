# Step4b: API - カテゴリ関連 Service・Controller・Router

step4a で作成した Repository を使って、カテゴリ・自動分類ルール・ユーザー個別分類ルールの Service・Controller・Router を実装する。

## 対応内容

### 1. カテゴリ Service

`apps/api/src/service/category-service.ts` を作成:

```typescript
import { logger } from "../log"
import { CategoryRepository, CreateCategoryInput, UpdateCategoryInput } from "../repository/mysql"
import { Category } from "../types/domain"

/**
 * カテゴリ一覧を取得
 */
export const getAllCategories = async (
  categoryRepository: CategoryRepository
): Promise<Category[]> => {
  logger.debug("CategoryService: Fetching all categories")
  const categories = await categoryRepository.findAll()
  logger.debug("CategoryService: Categories fetched", { count: categories.length })
  return categories
}

/**
 * カテゴリを作成
 */
export const createCategory = async (
  data: CreateCategoryInput,
  categoryRepository: CategoryRepository
): Promise<Category> => {
  logger.debug("CategoryService: Creating category", { name: data.name })
  const category = await categoryRepository.create(data)
  logger.debug("CategoryService: Category created", { id: category.id })
  return category
}

/**
 * カテゴリを更新
 */
export const updateCategory = async (
  id: number,
  data: UpdateCategoryInput,
  categoryRepository: CategoryRepository
): Promise<Category | null> => {
  logger.debug("CategoryService: Updating category", { id })
  const existing = await categoryRepository.findById(id)
  if (!existing) {
    logger.debug("CategoryService: Category not found for update", { id })
    return null
  }
  const category = await categoryRepository.update(id, data)
  logger.debug("CategoryService: Category updated", { id: category.id })
  return category
}

/**
 * カテゴリを削除
 */
export const deleteCategory = async (
  id: number,
  categoryRepository: CategoryRepository
): Promise<boolean> => {
  logger.debug("CategoryService: Deleting category", { id })
  const existing = await categoryRepository.findById(id)
  if (!existing) {
    logger.debug("CategoryService: Category not found for deletion", { id })
    return false
  }
  await categoryRepository.deleteById(id)
  logger.debug("CategoryService: Category deleted", { id })
  return true
}
```

### 2. カテゴリルール Service

`apps/api/src/service/category-rule-service.ts` を作成:

```typescript
import { logger } from "../log"
import { CategoryRuleRepository, CreateCategoryRuleInput, UpdateCategoryRuleInput } from "../repository/mysql"
import { CategoryRule } from "../types/domain"

/**
 * マスタールール一覧を取得
 */
export const getAllCategoryRules = async (
  categoryRuleRepository: CategoryRuleRepository
): Promise<CategoryRule[]> => {
  logger.debug("CategoryRuleService: Fetching all category rules")
  const rules = await categoryRuleRepository.findAll()
  logger.debug("CategoryRuleService: Rules fetched", { count: rules.length })
  return rules
}

/**
 * マスタールールを作成
 */
export const createCategoryRule = async (
  data: CreateCategoryRuleInput,
  categoryRuleRepository: CategoryRuleRepository
): Promise<CategoryRule> => {
  logger.debug("CategoryRuleService: Creating rule", { keyword: data.keyword })
  const rule = await categoryRuleRepository.create(data)
  logger.debug("CategoryRuleService: Rule created", { id: rule.id })
  return rule
}

/**
 * マスタールールを更新
 */
export const updateCategoryRule = async (
  id: number,
  data: UpdateCategoryRuleInput,
  categoryRuleRepository: CategoryRuleRepository
): Promise<CategoryRule> => {
  logger.debug("CategoryRuleService: Updating rule", { id })
  const rule = await categoryRuleRepository.update(id, data)
  logger.debug("CategoryRuleService: Rule updated", { id: rule.id })
  return rule
}

/**
 * マスタールールを削除
 */
export const deleteCategoryRule = async (
  id: number,
  categoryRuleRepository: CategoryRuleRepository
): Promise<void> => {
  logger.debug("CategoryRuleService: Deleting rule", { id })
  await categoryRuleRepository.deleteById(id)
  logger.debug("CategoryRuleService: Rule deleted", { id })
}
```

### 3. ユーザー個別分類ルール Service

`apps/api/src/service/user-category-rule-service.ts` を作成:

```typescript
import { logger } from "../log"
import { CreateUserCategoryRuleInput, UpdateUserCategoryRuleInput, UserCategoryRuleRepository } from "../repository/mysql"
import { UserCategoryRule } from "../types/domain"

/**
 * ユーザールール一覧を取得
 */
export const getUserCategoryRules = async (
  userId: number,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule[]> => {
  logger.debug("UserCategoryRuleService: Fetching user rules", { userId })
  const rules = await userCategoryRuleRepository.findByUserId(userId)
  logger.debug("UserCategoryRuleService: Rules fetched", { count: rules.length, userId })
  return rules
}

/**
 * ユーザールールを作成
 */
export const createUserCategoryRule = async (
  userId: number,
  data: CreateUserCategoryRuleInput,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule> => {
  logger.debug("UserCategoryRuleService: Creating user rule", { keyword: data.keyword, userId })
  const rule = await userCategoryRuleRepository.create(userId, data)
  logger.debug("UserCategoryRuleService: User rule created", { id: rule.id })
  return rule
}

/**
 * ユーザールールを更新
 */
export const updateUserCategoryRule = async (
  id: number,
  userId: number,
  data: UpdateUserCategoryRuleInput,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule> => {
  logger.debug("UserCategoryRuleService: Updating user rule", { id, userId })
  const rule = await userCategoryRuleRepository.update(id, userId, data)
  logger.debug("UserCategoryRuleService: User rule updated", { id: rule.id })
  return rule
}

/**
 * ユーザールールを削除
 */
export const deleteUserCategoryRule = async (
  id: number,
  userId: number,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<void> => {
  logger.debug("UserCategoryRuleService: Deleting user rule", { id, userId })
  await userCategoryRuleRepository.deleteById(id, userId)
  logger.debug("UserCategoryRuleService: User rule deleted", { id })
}

/**
 * ユーザールールの upsert（取引カテゴリ変更時に自動呼び出し）
 */
export const upsertUserCategoryRuleByKeyword = async (
  userId: number,
  keyword: string,
  categoryId: number,
  userCategoryRuleRepository: UserCategoryRuleRepository
): Promise<UserCategoryRule> => {
  logger.debug("UserCategoryRuleService: Upserting user rule", { categoryId, keyword, userId })
  const rule = await userCategoryRuleRepository.upsertByKeyword(userId, keyword, categoryId)
  logger.debug("UserCategoryRuleService: User rule upserted", { id: rule.id })
  return rule
}
```

### 4. Service の index.ts にエクスポート追加

`apps/api/src/service/index.ts` に追加:

```typescript
export * as category from "./category-service"
export * as categoryRule from "./category-rule-service"
export * as userCategoryRule from "./user-category-rule-service"
```

### 5. カテゴリ Controller

`apps/api/src/controller/category/list.ts`, `create.ts`, `update.ts`, `delete.ts` を作成する。

各コントローラーは `CategoryRepository` を constructor で受け取り、`service.category.*` を呼び出す。
既存の `MemoListController` 等と同一パターンで実装する。

### 6. カテゴリルール Controller

`apps/api/src/controller/category-rule/` に `list.ts`, `create.ts`, `update.ts`, `delete.ts` を作成する。
各コントローラーは `CategoryRuleRepository` を constructor で受け取り、`service.categoryRule.*` を呼び出す。

### 7. ユーザー個別分類ルール Controller

`apps/api/src/controller/user-category-rule/` に `list.ts`, `create.ts`, `update.ts`, `delete.ts` を作成する。
各コントローラーは `UserCategoryRuleRepository` を constructor で受け取り、`service.userCategoryRule.*` を呼び出す。`req.user!.id` から userId を取得する。

### 8. カテゴリ Router

`apps/api/src/routes/category-router.ts` を作成。カテゴリ Router と同一パターンで `category-rule-router.ts`、`user-category-rule-router.ts` も作成する。

### 9. index.ts にワイヤリング追加

`apps/api/src/index.ts` に Repository → Controller → Router の順にインスタンス化して組み立てる。

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

# マスタールール一覧取得
curl http://localhost:8080/api/category-rules

# マスタールール作成
curl -X POST http://localhost:8080/api/category-rules \
  -H "Content-Type: application/json" \
  -d '{"category_id":1,"keyword":"テスト店","match_type":"PARTIAL","priority":10}'

# ユーザールール一覧取得
curl http://localhost:8080/api/user-category-rules \
  -H "Authorization: Bearer <token>"

# ユーザールール作成
curl -X POST http://localhost:8080/api/user-category-rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"category_id":1,"keyword":"マイ店舗","match_type":"PARTIAL","priority":10}'

# ユーザールール更新
curl -X PUT http://localhost:8080/api/user-category-rules/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"category_id":5}'

# ユーザールール削除
curl -X DELETE http://localhost:8080/api/user-category-rules/1 \
  -H "Authorization: Bearer <token>"
```

各APIが正常にレスポンスを返すことを確認する。
