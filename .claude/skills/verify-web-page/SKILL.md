---
name: verify-web-page
description: フロントエンド（apps/web、apps/admin）の実装・修正後に Playwright MCP で実画面の動作確認を行う skill。dev サーバの起動確認、認証必須ページへの JWT cookie 注入、navigate / console_messages / snapshot による検証手順を標準化する。`pnpm build` だけで「動作確認済み」と報告するのは禁止であり、UI コードを書いたら必ずこの skill を実行する。ユーザーが「動作確認して」「画面で確認して」「ちゃんと動くか」と尋ねた場合、または UI 実装直後に自発的に呼び出す。
---

# verify-web-page

UI コードを書いた直後に **必ず** 実行する動作確認 skill。`pnpm build` の通過は型・ルート登録のチェックでしかなく、実際のレンダリング不具合・コンソールエラー・認証フローは検出できない。

## 対象

- `apps/web`（port 3000）
- `apps/admin`（port 3030）— Admin 認証は将来実装。現状はそのまま navigate

## 進め方

### Step 1: dev サーバの起動確認

```bash
curl -s -o /dev/null -w "web=%{http_code} api=%{http_code}\n" http://localhost:3000 -o /dev/null && \
curl -s http://localhost:8080/api/health
```

- web が 200 / 307（middleware redirect） を返す
- api の `/api/health` が `{"status":"ok"}` を返す

両方走っていない場合: ユーザーに「`pnpm dev` を起動してください」と伝える。勝手に `pnpm dev` を `run_in_background` で立ち上げない（既存セッションと競合するリスク）。

### Step 2: 検証対象ページの認証要否を確認

| 認証要否 | 例 | 手順 |
|----------|------|------|
| 不要（PUBLIC_PATHS） | `/sign-in` | そのまま `browser_navigate` |
| 必要 | 認証ミドルウェアの対象ページ | Step 3 で cookie を注入 |

`apps/web/src/middleware.ts` の `AUTH_TOKEN_COOKIE` 判定対象を見て判定する。

### Step 3: 認証必須ページの場合 — JWT を発行して cookie 注入

#### 3-1. テスト用ユーザーの id を確認

dev DB のユーザー一覧を MySQL に直結して確認する:

```bash
docker exec -i money-management-mysql mysql -uroot -ppassword -D money-management_dev \
  -e "SELECT id, name FROM users ORDER BY id LIMIT 10"
```

ユーザーがいない、もしくは検証用に追加プロパティを注入したい場合は SQL で UPDATE する。

#### 3-2. JWT を発行

```bash
cd apps/api && pnpm issue-test-token <userId>
# 例: pnpm issue-test-token 1
```

`{"token":"...","userId":1}` が出力される。**token の有効期限は環境変数 `JWT_EXPIRATION` 次第**（デフォルト 30d）。

#### 3-3. Playwright に cookie を注入

```js
mcp__playwright__browser_evaluate({
  function: `() => {
    document.cookie = "auth_token=<TOKEN>; path=/; max-age=2592000";
  }`
})
```

Cookie 名は `apps/web/src/middleware.ts` の `AUTH_TOKEN_COOKIE` 定数（`auth_token`）。

> 本番では `httpOnly: true` で設定されるが、検証用にブラウザ側 `document.cookie` で設定する。Server Component から `cookies()` で読めれば middleware を通過する。

注入後にもう一度 `browser_navigate` で目的のページに遷移する（cookie 設定だけでは画面は再描画されない）。

### Step 4: ページの検証

```js
mcp__playwright__browser_navigate({ url: "http://localhost:3000/<path>" })
mcp__playwright__browser_console_messages({ level: "error" })
mcp__playwright__browser_snapshot({})
```

合格条件:

1. **`browser_navigate` が目的の URL のままで完了**（Step 2 の認証必須ページが `/sign-in?redirect=...` に飛んでいないこと）
2. **`browser_console_messages` の `level: "error"` が 0 件**
3. **`browser_snapshot` で意図した要素が見える**（仕様書で定義した見出し / フォーム項目 / アクションボタン等）

### Step 5: スクリーンショット（任意）

ユーザーへの報告 / 仕様書貼付が必要な場合のみ:

```js
mcp__playwright__browser_take_screenshot({
  type: "png",
  filename: "verify-<feature>.png",
  fullPage: true,
})
```

`docs/spec/{feature}/` に貼る場合は `design-mock` skill のフローを併用する。

### Step 6: エラーがあれば修正してループ

- console error が出ている → 該当箇所のソースを Read してエラー原因を特定 → 修正 → Step 4 から再実行
- snapshot に意図した要素がない → 仕様書とコードの齟齬を確認 → 修正 → 再実行

修正完了するまで「動作確認済み」と報告しない。

## 失敗例（やってはいけないこと）

- `pnpm build` の通過だけで「動作確認済み」と報告する
- `browser_navigate` でリダイレクトされて `/sign-in` に着地しているのに気付かず OK 判定する
- console error を確認せず snapshot だけで OK 判定する（hydration error など UI 上は見えない不具合を見逃す）

## ユーザー向け報告フォーマット

```
動作確認結果（/<path>）:
- ステータス: 200 OK
- console errors: 0
- 表示確認: <主要要素 1>, <主要要素 2>, <アクションボタン>
- スクショ: .playwright-mcp/<filename>.png（必要な場合のみ）
```
