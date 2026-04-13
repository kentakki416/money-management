# Step6b: API - 集計 Service・Controller・Router

step6a で作成した Repository を使って、集計 API の Service・Controller・Router を実装する。

## 対応内容

### 1. 集計 Service

`apps/api/src/service/summary-service.ts` を作成:

- `getMonthlySummary`: 月間カテゴリ別集計 + 割合計算
- `getCalendarSummary`: カレンダー用日別集計
- `getTrend`: 過去N月のカテゴリ別月次推移 + 欠損月の0補完

### 2. Service の index.ts にエクスポート追加

```typescript
export * as summary from "./summary-service"
```

### 3. Controller

既存の Controller パターンに従い、以下を作成:

- `apps/api/src/controller/summary/monthly.ts` — `SummaryMonthlyController`
- `apps/api/src/controller/summary/calendar.ts` — `SummaryCalendarController`
- `apps/api/src/controller/summary/trend.ts` — `SummaryTrendController`

各コントローラーは `SummaryRepository` を constructor で受け取り、`service.summary.*` を呼び出す。
クエリパラメーター（`year`, `month`, `months`）をバリデーションする。

### 4. Router

`apps/api/src/routes/summary-router.ts` を作成:

```
GET /api/summary/monthly?year=2026&month=3   → SummaryMonthlyController
GET /api/summary/calendar?year=2026&month=3  → SummaryCalendarController
GET /api/summary/trend?months=12             → SummaryTrendController
```

### 5. index.ts にワイヤリング追加

Repository → Controller → Router の順にインスタンス化して組み立てる。

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

各APIが正常にレスポンスを返すことを確認する。
