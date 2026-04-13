# Step7d: Admin - ダッシュボード画面

既存の TailAdmin ecommerce コンポーネントを活用し、Admin ダッシュボードを構築する。

## 対応内容

### 1. EcommerceMetrics の修正

`apps/admin/src/components/features/ecommerce/EcommerceMetrics.tsx` を修正:

- テンプレート元の構造（`GroupIcon`, `BoxIconLine`, `Badge`, `ArrowUpIcon/ArrowDownIcon`）を維持
- props で `users` と `csvUploads` を受け取る
- ラベルを「Customers」→「登録ユーザー数」、「Orders」→「CSV取込数」に変更

```typescript
interface EcommerceMetricsProps {
  csvUploads?: number | null
  users?: number | null
}

export const EcommerceMetrics = ({ csvUploads, users }: EcommerceMetricsProps) => {
  // テンプレート元の構造はそのまま維持
  // 値の部分を props で差し替え:
  //   users != null ? users.toLocaleString() : "-"
  //   csvUploads != null ? csvUploads.toLocaleString() : "-"
}
```

### 2. MonthlySalesChart の修正

`apps/admin/src/components/features/ecommerce/MonthlySalesChart.tsx` を修正:

- Dropdown（View More / Delete）を削除
- 期間切替タブを追加（1年 / 1ヶ月 / 7日 / 24時間）
- タブ切替で `GET /api/admin/stats?period=xxx` を呼び出し
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

### 3. ダッシュボードページ

`apps/admin/src/app/(dashboard)/page.tsx` を修正:

- `"use client"` でクライアントコンポーネントにする
- `useEffect` で `GET /api/admin/stats` を呼び出し（`EcommerceMetrics` 用）
- テンプレート元と同じ grid レイアウトで全コンポーネントを配置
- `MonthlySalesChart` は自前でデータ取得するため props 不要

```tsx
export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null)

  useEffect(() => { /* fetchStats */ }, [])

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics csvUploads={stats?.total_csv_uploads} users={stats?.total_users} />
        <MonthlySalesChart />
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

## 動作確認

```bash
cd apps/admin && pnpm dev
```

1. `http://localhost:3030/` にアクセス
2. 登録ユーザー数・CSV取込数カードにダミーデータが表示される
3. 月別ユーザー登録推移の棒グラフが表示される
4. タブ切替（1年/1ヶ月/7日/24時間）でグラフが切り替わる
5. MonthlyTarget / StatisticsChart / DemographicCard / RecentOrders がテンプレートのまま表示される
