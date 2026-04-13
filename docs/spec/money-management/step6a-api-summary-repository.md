# Step6a: API - 集計 Repository

ダッシュボード・カレンダー・グラフ用の集計 Repository を実装する。

## 対応内容

### 1. ドメイン型定義

`apps/api/src/types/domain/summary.ts` を作成:

```typescript
export type CategorySummary = {
  amount: number
  categoryColor: string
  categoryId: number
  categoryName: string
}

export type DailySummary = {
  amount: number
  date: string
  transactionCount: number
}

export type MonthlyTrend = {
  amount: number
  categoryColor: string
  categoryId: number
  categoryName: string
  month: number
  year: number
}
```

`apps/api/src/types/domain/index.ts` にエクスポート追加:

```typescript
export type { CategorySummary, DailySummary, MonthlyTrend } from "./summary"
```

### 2. 集計 Repository

`apps/api/src/repository/mysql/summary-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated/client"
import { CategorySummary, DailySummary, MonthlyTrend } from "../../types/domain"

/**
 * 集計リポジトリのインターフェース
 */
export interface SummaryRepository {
  getDailySummary(userId: number, year: number, month: number): Promise<DailySummary[]>
  getMonthlyCategorySummary(userId: number, year: number, month: number): Promise<CategorySummary[]>
  getMonthlyTrend(userId: number, months: number): Promise<MonthlyTrend[]>
}

/**
 * Prisma実装の集計リポジトリ
 */
export class PrismaSummaryRepository implements SummaryRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  /**
   * カレンダー用: 指定月の日別支出合計
   */
  async getDailySummary(userId: number, year: number, month: number): Promise<DailySummary[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const results = await this._prisma.transaction.groupBy({
      _count: { id: true },
      _sum: { amount: true },
      by: ["transactionDate"],
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        userId,
      },
    })

    return results.map((r) => ({
      amount: r._sum.amount ?? 0,
      date: r.transactionDate.toISOString().split("T")[0]!,
      transactionCount: r._count.id,
    }))
  }

  /**
   * 月間カテゴリ別集計
   */
  async getMonthlyCategorySummary(userId: number, year: number, month: number): Promise<CategorySummary[]> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const results = await this._prisma.transaction.groupBy({
      _sum: { amount: true },
      by: ["categoryId"],
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        userId,
      },
    })

    const categoryIds = results
      .map((r) => r.categoryId)
      .filter((id): id is number => id !== null)

    const categories = await this._prisma.category.findMany({
      where: { id: { in: categoryIds } },
    })

    const categoryMap = new Map(categories.map((c) => [c.id, c]))

    return results.map((r) => {
      const category = categoryMap.get(r.categoryId ?? 99)
      return {
        amount: r._sum.amount ?? 0,
        categoryColor: category?.color ?? "#CCCCCC",
        categoryId: r.categoryId ?? 99,
        categoryName: category?.name ?? "未分類",
      }
    }).sort((a, b) => b.amount - a.amount)
  }

  /**
   * 月次推移: 過去N月のカテゴリ別月別集計
   */
  async getMonthlyTrend(userId: number, months: number): Promise<MonthlyTrend[]> {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

    const transactions = await this._prisma.transaction.findMany({
      include: { category: true },
      where: {
        transactionDate: { gte: startDate },
        userId,
      },
    })

    const groupMap = new Map<string, MonthlyTrend>()

    for (const tx of transactions) {
      const txDate = tx.transactionDate
      const year = txDate.getFullYear()
      const month = txDate.getMonth() + 1
      const categoryId = tx.categoryId ?? 99
      const key = `${year}-${month}-${categoryId}`

      const existing = groupMap.get(key)
      if (existing) {
        existing.amount += tx.amount
      } else {
        groupMap.set(key, {
          amount: tx.amount,
          categoryColor: tx.category?.color ?? "#CCCCCC",
          categoryId,
          categoryName: tx.category?.name ?? "未分類",
          month,
          year,
        })
      }
    }

    return Array.from(groupMap.values())
  }
}
```

### 3. Repository の index.ts にエクスポート追加

```typescript
export * from "./summary-repository"
```

## 動作確認

### ビルド確認

```bash
cd apps/api
pnpm build
```

エラーなくビルドが完了することを確認する。
