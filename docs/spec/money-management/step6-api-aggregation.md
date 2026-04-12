# Step6: API - 集計・カレンダー・グラフ

ダッシュボード・カレンダー・グラフ用の集計APIを実装する。

## 対応内容

### 1. 集計 Repository

`apps/api/src/repository/mysql/prisma-summary-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated"

export type CategorySummaryData = {
  amount: number
  categoryColor: string
  categoryId: number
  categoryName: string
}

export type DailySummaryData = {
  amount: number
  date: string // YYYY-MM-DD
  transactionCount: number
}

export type MonthlyTrendData = {
  amount: number
  categoryColor: string
  categoryId: number
  categoryName: string
  month: number
  year: number
}

export const createPrismaSummaryRepository = (prisma: PrismaClient) => ({
  /**
   * カレンダー用: 指定月の日別支出合計
   */
  getDailySummary: async (userId: number, year: number, month: number): Promise<DailySummaryData[]> => {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const results = await prisma.transaction.groupBy({
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
  },

  /**
   * 月間カテゴリ別集計
   */
  getMonthlyCategorySummary: async (userId: number, year: number, month: number): Promise<CategorySummaryData[]> => {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const results = await prisma.transaction.groupBy({
      _sum: { amount: true },
      by: ["categoryId"],
      where: {
        transactionDate: { gte: startDate, lte: endDate },
        userId,
      },
    })

    // カテゴリ情報を取得
    const categoryIds = results
      .map((r) => r.categoryId)
      .filter((id): id is number => id !== null)

    const categories = await prisma.category.findMany({
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
    }).sort((a, b) => b.amount - a.amount) // 金額降順
  },

  /**
   * 月次推移: 過去N月のカテゴリ別月別集計
   */
  getMonthlyTrend: async (userId: number, months: number): Promise<MonthlyTrendData[]> => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      where: {
        transactionDate: { gte: startDate },
        userId,
      },
    })

    // 年月 × カテゴリ でグルーピング
    const groupMap = new Map<string, MonthlyTrendData>()

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
  },
})

export type PrismaSummaryRepository = ReturnType<typeof createPrismaSummaryRepository>
```

### 2. 集計 Service

`apps/api/src/service/summary-service.ts` を作成:

```typescript
import { PrismaSummaryRepository } from "../repository/mysql/prisma-summary-repository"

export const createSummaryService = (repo: PrismaSummaryRepository) => ({
  getCalendarSummary: async (userId: number, year: number, month: number) => {
    const days = await repo.getDailySummary(userId, year, month)
    const totalAmount = days.reduce((sum, d) => sum + d.amount, 0)
    return { days, month, totalAmount, year }
  },

  getMonthlySummary: async (userId: number, year: number, month: number) => {
    const categorySummaries = await repo.getMonthlyCategorySummary(userId, year, month)
    const totalAmount = categorySummaries.reduce((sum, c) => sum + c.amount, 0)

    const categories = categorySummaries.map((c) => ({
      ...c,
      percentage: totalAmount > 0 ? Math.round((c.amount / totalAmount) * 1000) / 10 : 0,
    }))

    return { categories, month, totalAmount, year }
  },

  getTrend: async (userId: number, months: number) => {
    const trendData = await repo.getMonthlyTrend(userId, months)

    // カテゴリ別にグルーピング
    const categoryMap = new Map<number, {
      categoryColor: string
      categoryId: number
      categoryName: string
      data: { amount: number; month: number; year: number }[]
    }>()

    // 月リスト生成
    const now = new Date()
    const monthsList: { month: number; year: number }[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthsList.push({ month: d.getMonth() + 1, year: d.getFullYear() })
    }

    // 合計データ
    const totalMap = new Map<string, number>()

    for (const item of trendData) {
      const key = `${item.year}-${item.month}`
      totalMap.set(key, (totalMap.get(key) ?? 0) + item.amount)

      if (!categoryMap.has(item.categoryId)) {
        categoryMap.set(item.categoryId, {
          categoryColor: item.categoryColor,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          data: [],
        })
      }
      categoryMap.get(item.categoryId)!.data.push({
        amount: item.amount,
        month: item.month,
        year: item.year,
      })
    }

    // 各カテゴリのデータに欠損月を0で補完
    for (const [, cat] of categoryMap) {
      const existingMonths = new Set(cat.data.map((d) => `${d.year}-${d.month}`))
      for (const m of monthsList) {
        if (!existingMonths.has(`${m.year}-${m.month}`)) {
          cat.data.push({ amount: 0, month: m.month, year: m.year })
        }
      }
      cat.data.sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year)
    }

    const total = monthsList.map((m) => ({
      amount: totalMap.get(`${m.year}-${m.month}`) ?? 0,
      month: m.month,
      year: m.year,
    }))

    return {
      categories: Array.from(categoryMap.values()),
      months: monthsList,
      total,
    }
  },
})

export type SummaryService = ReturnType<typeof createSummaryService>
```

### 3. 集計 Controller

`apps/api/src/controller/summary/monthly.ts`:

```typescript
import { Request, Response } from "express"
import { monthlySummaryResponseSchema } from "@repo/api-schema"
import { SummaryService } from "../../service/summary-service"

export const createMonthlySummaryController = (service: SummaryService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const year = parseInt(req.query.year as string, 10)
    const month = parseInt(req.query.month as string, 10)

    if (!year || !month) {
      res.status(400).json({ error: "year and month are required", status_code: 400 })
      return
    }

    const summary = await service.getMonthlySummary(userId, year, month)

    const response = monthlySummaryResponseSchema.parse({
      categories: summary.categories.map((c) => ({
        amount: c.amount,
        category_color: c.categoryColor,
        category_id: c.categoryId,
        category_name: c.categoryName,
        percentage: c.percentage,
      })),
      month: summary.month,
      total_amount: summary.totalAmount,
      year: summary.year,
    })

    res.json(response)
  }
```

`apps/api/src/controller/summary/calendar.ts`:

```typescript
import { Request, Response } from "express"
import { calendarSummaryResponseSchema } from "@repo/api-schema"
import { SummaryService } from "../../service/summary-service"

export const createCalendarSummaryController = (service: SummaryService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const year = parseInt(req.query.year as string, 10)
    const month = parseInt(req.query.month as string, 10)

    if (!year || !month) {
      res.status(400).json({ error: "year and month are required", status_code: 400 })
      return
    }

    const summary = await service.getCalendarSummary(userId, year, month)

    const response = calendarSummaryResponseSchema.parse({
      days: summary.days.map((d) => ({
        amount: d.amount,
        date: d.date,
        transaction_count: d.transactionCount,
      })),
      month: summary.month,
      total_amount: summary.totalAmount,
      year: summary.year,
    })

    res.json(response)
  }
```

`apps/api/src/controller/summary/trend.ts`:

```typescript
import { Request, Response } from "express"
import { trendResponseSchema } from "@repo/api-schema"
import { SummaryService } from "../../service/summary-service"

export const createTrendController = (service: SummaryService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const months = parseInt(req.query.months as string, 10) || 12

    const trend = await service.getTrend(userId, months)

    const response = trendResponseSchema.parse({
      categories: trend.categories.map((c) => ({
        category_color: c.categoryColor,
        category_id: c.categoryId,
        category_name: c.categoryName,
        data: c.data.map((d) => ({
          amount: d.amount,
          month: d.month,
          year: d.year,
        })),
      })),
      months: trend.months,
      total: trend.total,
    })

    res.json(response)
  }
```

### 4. 集計ルーター

`apps/api/src/routes/summary-router.ts`:

```typescript
import { Router } from "express"

import { createCalendarSummaryController } from "../controller/summary/calendar"
import { createMonthlySummaryController } from "../controller/summary/monthly"
import { createTrendController } from "../controller/summary/trend"
import { SummaryService } from "../service/summary-service"

export const createSummaryRouter = (service: SummaryService): Router => {
  const router = Router()

  router.get("/monthly", createMonthlySummaryController(service))
  router.get("/calendar", createCalendarSummaryController(service))
  router.get("/trend", createTrendController(service))

  return router
}
```

### 5. index.ts にルート追加

```typescript
import { createSummaryRouter } from "./routes/summary-router"
import { createPrismaSummaryRepository } from "./repository/mysql/prisma-summary-repository"
import { createSummaryService } from "./service/summary-service"

const summaryRepo = createPrismaSummaryRepository(prisma)
const summaryService = createSummaryService(summaryRepo)

app.use("/api/summary", createSummaryRouter(summaryService))
```

## 動作確認

### curlによるAPI確認

```bash
# 月間カテゴリ別集計
curl "http://localhost:8080/api/summary/monthly?year=2026&month=2" \
  -H "Authorization: Bearer <token>"

# カレンダー用日別集計
curl "http://localhost:8080/api/summary/calendar?year=2026&month=2" \
  -H "Authorization: Bearer <token>"

# 月次推移（過去12ヶ月）
curl "http://localhost:8080/api/summary/trend?months=12" \
  -H "Authorization: Bearer <token>"
```

### 期待されるレスポンス例

**月間集計 (`/api/summary/monthly`)**:
```json
{
  "year": 2026,
  "month": 2,
  "total_amount": 114241,
  "categories": [
    { "category_id": 6, "category_name": "エンタメ", "category_color": "#FF9F40", "amount": 35425, "percentage": 31.0 },
    { "category_id": 5, "category_name": "ショッピング", "category_color": "#9966FF", "amount": 21098, "percentage": 18.5 },
    { "category_id": 2, "category_name": "交通", "category_color": "#36A2EB", "amount": 33400, "percentage": 29.2 }
  ]
}
```

**カレンダー (`/api/summary/calendar`)**:
```json
{
  "year": 2026,
  "month": 2,
  "total_amount": 114241,
  "days": [
    { "date": "2026-02-01", "amount": 4356, "transaction_count": 1 },
    { "date": "2026-02-02", "amount": 480, "transaction_count": 1 },
    { "date": "2026-02-03", "amount": 10480, "transaction_count": 3 }
  ]
}
```
