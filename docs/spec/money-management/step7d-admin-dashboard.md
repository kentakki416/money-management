# Step7d: Admin - ダッシュボード画面

TailAdmin テンプレートを活用し、Admin ダッシュボードを構築する。

## 対応内容

### 1. DashboardMetrics コンポーネント

`apps/admin/src/components/features/dashboard/DashboardMetrics.tsx` を新規作成:

- テンプレート元の構造（`GroupIcon`, `BoxIconLine`, `Badge`, `ArrowUpIcon/ArrowDownIcon`）を活用
- props で `users` と `csvUploads` を受け取る
- ラベルは「登録ユーザー数」「CSV取込数」

```typescript
interface DashboardMetricsProps {
  csvUploads?: number | null
  users?: number | null
}

export function DashboardMetrics({ csvUploads, users }: DashboardMetricsProps) {
  // テンプレート元の構造を活用
  // 値の部分を props で差し替え:
  //   users != null ? users.toLocaleString() : "-"
  //   csvUploads != null ? csvUploads.toLocaleString() : "-"
}
```

### 2. Route Handler（タブ切替用データ取得）

`apps/admin/src/app/api/admin/stats/route.ts` を新規作成:

Client Component（`UserRegistrationChart`）からのタブ切替時にデータを再取得するための Route Handler。Server Action はデータ変更（mutation）専用のため、データ取得には Route Handler を使用する。

```typescript
import { NextRequest, NextResponse } from "next/server"

import { apiClient } from "@/libs/api-client"

export const GET = async (request: NextRequest) => {
  const period = request.nextUrl.searchParams.get("period") || "yearly"
  const stats = await apiClient.get(`/api/admin/stats?period=${period}`)
  return NextResponse.json(stats)
}
```

### 3. UserRegistrationChart コンポーネント

`apps/admin/src/components/features/dashboard/UserRegistrationChart.tsx` を新規作成:

- Dropdown（View More / Delete）を削除
- 期間切替タブを追加（1年 / 1ヶ月 / 7日 / 24時間）
- タブ切替で Route Handler (`/api/admin/stats?period=xxx`) を fetch で呼び出し
- コンポーネント内で自前データ取得（親から props 不要）
- タブスタイルは既存 `ChartTab` コンポーネントのパターン（`bg-gray-100 p-0.5 rounded-lg`）を踏襲

```typescript
const TABS: { label: string; value: RegistrationPeriod }[] = [
  { label: "1年", value: "yearly" },
  { label: "1ヶ月", value: "monthly" },
  { label: "7日", value: "weekly" },
  { label: "24時間", value: "daily" },
]
```

データ取得:
```typescript
useEffect(() => {
  let cancelled = false
  const loadStats = async () => {
    const res = await fetch(`/api/admin/stats?period=${selected}`)
    const stats: AdminStatsResponse = await res.json()
    if (!cancelled) {
      setChartData({
        categories: stats.registrations.map((r) => r.label),
        data: stats.registrations.map((r) => r.count),
      })
    }
  }
  loadStats()
  return () => { cancelled = true }
}, [selected])
```

タブUI:
```tsx
<div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
  {TABS.map((tab) => (
    <button
      key={tab.value}
      className={`rounded-md px-3 py-2 text-theme-sm font-medium ... ${
        selected === tab.value
          ? "bg-white text-gray-900 shadow-theme-xs dark:bg-gray-800 dark:text-white"
          : "text-gray-500 dark:text-gray-400"
      }`}
      onClick={() => handleTabChange(tab.value)}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### 4. ダッシュボードページ

`apps/admin/src/app/(dashboard)/page.tsx` を修正:

- Server Component として `apiClient.get` で `GET /api/admin/stats` を呼び出し（サーバー間通信）
- テンプレート元と同じ grid レイアウトで全コンポーネントを配置
- `DashboardMetrics` に取得データを props で渡す
- `UserRegistrationChart` はタブ切替があるため Client Component として Route Handler 経由でデータ取得

```tsx
import { apiClient } from "@/libs/api-client"

export default async function DashboardPage() {
  const stats = await apiClient.get<AdminStatsResponse>("/api/admin/stats")

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <DashboardMetrics csvUploads={stats.total_csv_uploads} users={stats.total_users} />
        <UserRegistrationChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>
      <div className="col-span-12">
        <StatisticsChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  )
}
```

`MonthlyTarget` / `StatisticsChart` / `DemographicCard` / `RecentOrders` はテンプレート元のままハードコードで表示。

### 5. 不要ファイルの削除

- `apps/admin/src/app/actions/` ディレクトリを削除（Server Action をデータ取得に使うのは誤り）

## 動作確認

```bash
cd apps/admin && pnpm dev
```

1. `http://localhost:3030/` にアクセス
2. 登録ユーザー数・CSV取込数カードにダミーデータが表示される
3. ユーザー登録推移の棒グラフが表示される
4. タブ切替（1年/1ヶ月/7日/24時間）でグラフが切り替わる
5. MonthlyTarget / StatisticsChart / DemographicCard / RecentOrders がテンプレートのまま表示される
