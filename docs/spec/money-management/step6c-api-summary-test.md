# Step6c: API - 集計テスト

集計 API の Service ユニットテストと Controller インテグレーションテストを実装する。

## 対応内容

### 1. 集計 Service テスト

`test/service/summary-service/getMonthlySummary.test.ts`:

- `SummaryRepository` をモック
- カテゴリ別集計データが返ることを確認
- 割合（percentage）が正しく計算されることを確認（合計に対する各カテゴリの割合）
- 合計金額が正しく計算されることを確認
- データが0件の場合、total_amount が 0 で空配列を返すことを確認

`test/service/summary-service/getCalendarSummary.test.ts`:

- 日別集計データが返ることを確認
- 合計金額が正しく計算されることを確認
- データが0件の場合の動作確認

`test/service/summary-service/getTrend.test.ts`:

- カテゴリ別月次推移データが返ることを確認
- 欠損月が 0 で補完されることを確認
- 月リストが正しい期間（過去N月）で生成されることを確認
- 合計データ（total）が正しく集計されることを確認

### 2. 集計 Controller テスト

テスト用DBを使ったインテグレーションテスト。テスト前にカテゴリ・支払い元・取引データをseedする。

`test/controller/summary/monthly.test.ts`:

```typescript
import request from "supertest"

import { SummaryMonthlyController } from "@/controller/summary/monthly"
import { PrismaSummaryRepository } from "@/repository/mysql"
import { summaryRouter } from "@/routes/summary-router"

import { createTestApp, createTestUser } from "../helper"
import { cleanupTestData, testPrisma } from "../setup"

const summaryRepository = new PrismaSummaryRepository(testPrisma)
const app = createTestApp()
app.use(
  "/api/summary",
  summaryRouter({
    monthly: new SummaryMonthlyController(summaryRepository),
  })
)

describe("GET /api/summary/monthly", () => {
  let token: string
  let userId: number

  beforeEach(async () => {
    await cleanupTestData()
    const testUser = await createTestUser()
    token = testUser.token
    userId = testUser.user.id

    // テストデータ投入
    const category = await testPrisma.category.create({
      data: { id: 1, color: "#FF6384", name: "飲食", sortOrder: 1 },
    })
    const paymentSource = await testPrisma.paymentSource.create({
      data: { name: "テストカード", type: "SMBC", userId },
    })
    await testPrisma.transaction.createMany({
      data: [
        {
          amount: 1000, categoryId: category.id, description: "テスト1",
          isManual: true, paymentSourceId: paymentSource.id,
          transactionDate: new Date("2026-03-15"), userId,
        },
        {
          amount: 2000, categoryId: category.id, description: "テスト2",
          isManual: true, paymentSourceId: paymentSource.id,
          transactionDate: new Date("2026-03-20"), userId,
        },
      ],
    })
  })

  it("月間カテゴリ別集計を取得できる", async () => {
    const res = await request(app)
      .get("/api/summary/monthly?year=2026&month=3")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.year).toBe(2026)
    expect(res.body.month).toBe(3)
    expect(res.body.total_amount).toBe(3000)
    expect(res.body.categories).toHaveLength(1)
    expect(res.body.categories[0].category_name).toBe("飲食")
    expect(res.body.categories[0].amount).toBe(3000)
    expect(res.body.categories[0].percentage).toBe(100)
  })

  it("年月パラメーターが未指定の場合は400を返す", async () => {
    const res = await request(app)
      .get("/api/summary/monthly")
      .set("Authorization", `Bearer ${token}`)

    expect(res.status).toBe(400)
  })
})
```

`test/controller/summary/calendar.test.ts`:

- カレンダー用日別集計の取得確認
- 日付ごとの金額・取引件数の確認

`test/controller/summary/trend.test.ts`:

- 月次推移データの取得確認
- months パラメーターのデフォルト値（12）の動作確認

## 動作確認

### テスト実行

```bash
cd apps/api

# 集計 Service テスト
pnpm test -- --testPathPatterns="summary-service"

# 集計 Controller テスト（要DB起動）
pnpm test -- --testPathPatterns="controller/summary"
```

全テストがパスすることを確認する。
