# Step8a: Web - 共通部品（サイドバー・レイアウト・API通信基盤）

Web画面にAdmin同様の折りたたみサイドバーとダッシュボードレイアウトを導入する。

## 対応内容

### 1. API 通信基盤

Admin と同じパターンを使用する。ブラウザから Express API を直接 fetch しない。Server Components / Server Actions / Route Handler を経由してサーバー間通信する。

```
[初期表示] Server Component → Express API（サーバー間通信、CORS不要）
[動的取得] Client Component → Route Handler → Express API（サーバー間通信）
[CRUD操作] Client Component → Server Action → Express API（サーバー間通信）
[ファイルUP] Client Component → Route Handler → Express API（FormData転送）
```

**`apps/web/src/libs/api-client.ts`（サーバーサイド専用）はすでに存在する。** Admin と同一の実装。`NEXT_PUBLIC_` プレフィックスは不要（ブラウザに公開しない）。

既存の `apiClient` に `upload` メソッドを追加する:

```typescript
const API_BASE_URL = process.env.API_URL || "http://localhost:8080"

export const apiClient = {
  // ... 既存の delete, get, post, put はそのまま ...

  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      body: formData,
      method: "POST",
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(errorData.error || `API error: ${res.status}`)
    }
    return res.json() as Promise<T>
  },
}
```

### 2. サイドバー Context

Admin の `features/sidebar/sidebar.context.tsx` を `apps/web/src/features/sidebar/sidebar.context.tsx` にコピーして利用する。同一パターン。

### 3. サイドバーコンポーネント

`apps/web/src/components/layout/AppSidebar.tsx` を新規作成（Admin の AppSidebar を参考）。

ナビゲーション項目:

```typescript
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  List,
  Upload,
} from "lucide-react"

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "ダッシュボード",
    path: "/",
  },
  {
    icon: <Calendar size={20} />,
    name: "カレンダー",
    path: "/calendar",
  },
  {
    icon: <BarChart3 size={20} />,
    name: "グラフ",
    path: "/charts",
  },
  {
    icon: <List size={20} />,
    name: "取引一覧",
    path: "/transactions",
  },
  {
    icon: <Upload size={20} />,
    name: "CSVアップロード",
    path: "/upload",
  },
]
```

サブメニューは不要（Admin と異なりフラットなメニュー構成）。

### 4. ヘッダーコンポーネント

`apps/web/src/components/layout/AppHeader.tsx` を新規作成（Admin の AppHeader を参考）。

- ハンバーガーメニュー（モバイル用サイドバー開閉）
- アプリタイトル表示

### 5. Backdrop コンポーネント

`apps/web/src/components/layout/Backdrop.tsx` を新規作成（Admin と同一パターン）。

### 6. ダッシュボードレイアウト

`apps/web/src/app/(dashboard)/layout.tsx` を新規作成。

Admin の `(dashboard)/layout.tsx` と同じ構造。`SidebarProvider` で `children` をラップし、AppSidebar + AppHeader + main content を配置する。

**重要**: `layout.tsx` は `"use client"` で定義。SidebarProvider のコンテキストを使うため。ただし、子ページは Server Component として動作可能（Next.js の仕様）。

```tsx
"use client"
import React from "react"

import AppHeader from "@/components/layout/AppHeader"
import AppSidebar from "@/components/layout/AppSidebar"
import Backdrop from "@/components/layout/Backdrop"
import { SidebarProvider, useSidebar } from "@/features/sidebar/sidebar.context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[260px]"
      : "lg:ml-[70px]"

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        <AppHeader />
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  )
}
```

### 7. ダッシュボードトップページ

`apps/web/src/app/(dashboard)/page.tsx` を新規作成（既存の `app/page.tsx` のサンプルコードを置き換え）。

仮のダッシュボードページとして、「Money Manager」のウェルカムメッセージを表示する。

### 8. パッケージ追加

```bash
cd apps/web
pnpm add lucide-react
```

## 動作確認

```bash
cd apps/web && pnpm build
```

1. `http://localhost:3000` にアクセス → サイドバー付きレイアウト表示
2. サイドバーの折りたたみ・ホバー展開が動作する
3. モバイルサイズでハンバーガーメニューが動作する
4. 各ナビゲーションリンクのアクティブ状態が正しく表示される
