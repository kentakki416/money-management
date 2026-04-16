# API Server

Express.js + TypeScript による API サーバー

## プロジェクト概要

レイヤードアーキテクチャに基づいた REST API サーバー。Prisma による型安全なデータアクセス、依存性注入による疎結合な設計を採用。

## ディレクトリ構成

```
apps/api/
├── src/
│   ├── index.ts                         # エントリーポイント（DI、サーバー起動）
│   ├── client/                          # 外部APIクライアント（OAuth等）
│   ├── const/                           # 定数定義
│   ├── controller/                      # リクエスト/レスポンスハンドリング
│   │   └── auth/                        # 認証関連のコントローラー
│   ├── lib/                             # ユーティリティ（JWT等）
│   ├── log/                             # ロギング設定
│   ├── middleware/                      # 共通ミドルウェア
│   ├── prisma/                          # Prisma設定、マイグレーション
│   ├── repository/mysql/                # データアクセス層（Prisma）
│   │   └── aggregate/                   # 複数テーブルを跨ぐ操作
│   ├── routes/                          # ルーティング定義
│   ├── service/                         # ビジネスロジック（関数型）
│   └── types/                           # 型定義
│       └── domain/                      # ドメインモデルの型定義
├── .env.local                           # 環境変数
├── package.json
└── tsconfig.json
```

## 設計思想

### 依存方向

- レイヤードアーキテクチャを意識して、メインのアプリケーションロジックであるservice層がDBや外部ライブラリ等の詳細を知らなくて良いようにinterfaceを使用する。

### Interfaceの利用

- 引数やレスポンスにはアプリケーションの型を利用する（外部パッケージの型を変換して扱う）

### 関数型のService 層

- Service層はクラスベースではなく関数ベースにした理由
    1. クラスのDI・インスタンス化がめんどくさい
    2. controllerのテストはインテグレーションテストを想定しているためserviceのモックなどはしない
    3. クラスベースでの状態管理（プライベート引数等）を使用するケースが少ない
- Controller から必要な Repository/Client を引数として受け取る

### ドメインモデル

- types/domainにドメインモデルの型だけ定義している。
- 実装はドメインロジックが必要になるまでしない（おそらく必要になるケースが少ないので対応しない）
- Repository層でPrisma -> ドメインモデル型に変化することでInterfaceを差し替え可能なものにしている
- ビジネス上の区分・列挙型もここに定義する（例: `RegistrationPeriod`）
- Repository / Service は `types/domain` から型をインポートする（`@repo/api-schema` には依存しない）

### Repository 層の役割分担

- `repository/mysql/{feature}-repository.ts`: 単一テーブルに対する操作（CRUD、count、集計クエリ等）
- `repository/mysql/aggregate/`: 複数テーブルをまたぐ集約操作（リレーションの include、トランザクション等）
- Service層は欲しいデータを取得するだけで、詳細なリレーションは把握しなくて良い。必要なデータのリポジトリの関数を呼ぶだけでドメインロジックに集中できる設計にする

### エラーハンドリング（Result 型）

Service 層は業務エラー（重複・Not Found・権限不足など HTTP 4xx 系で返すべきエラー）を **`Result<T>` 型で返却** する。DB 障害などの予期しない例外のみ通常の `throw` として伝播し、グローバルエラーハンドラで 500 として処理される。

```typescript
// src/types/result.ts
export type ApiError = {
  statusCode: number
  type: "BAD_REQUEST" | "CONFLICT" | "FORBIDDEN" | "NOT_FOUND" | "UNAUTHORIZED"
  message: string
}

export type Result<T> =
  | { ok: true; value: T }
  | { error: ApiError; ok: false }
```

Controller 側での透過例:

```typescript
const result = await service.memo.getMemoById(id, memoRepository)

if (!result.ok) {
  const errorResponse: ErrorResponse = {
    error: result.error.message,
    status_code: result.error.statusCode,
  }
  return res.status(result.error.statusCode).json(errorResponse)
}

// result.value を利用してレスポンス生成
```

#### Result 型を導入している理由

1. **想定内エラーと想定外エラーを型で分離できる**
   - 想定内（業務エラー）: `Result.err` で返却 → Controller が 4xx に変換
   - 想定外（DB 障害等）: そのまま `throw` → グローバルエラーハンドラが 500 を返却
   - この区別が関数シグネチャで一目で分かる（`Promise<Result<T>>` vs `Promise<T>`）

2. **エラーハンドリング漏れを型で防げる**
   - `Result<T>` は discriminated union のため `.ok` チェックなしには `.value` にアクセスできない
   - Controller で service の呼び出し結果を処理し忘れるとコンパイルエラーになる

3. **エラーメッセージに依存する fragile な分岐が不要になる**
   - かつての `error.message.includes("...")` のような実装を撤廃
   - 代わりに `result.error.statusCode` / `result.error.type` を見て構造的に分岐可能

4. **テストが文言変更に強くなる**
   - `rejects.toThrow("具体的メッセージ")` のような脆い assertion を撤廃できる
   - `expect(result.ok).toBe(false)` + `expect(result.error.statusCode).toBe(409)` で十分

5. **Controller での HTTP ステータス決定が一元化される**
   - Service 層が statusCode を決定し、Controller はそのまま透過
   - 特殊ケースのみ Controller が明示的に再解釈（例: 404 → 400 の文脈変換）

詳細は `src/types/result.ts` とヘルパー関数（`ok`, `err`, `notFoundError`, `conflictError`, `badRequestError`）を参照。


## テスト戦略

### 基本方針

- **Service層 → ユニットテスト**: DB不要、高速、並列実行可能
- **Controller層 → インテグレーションテスト**: 実DB使用、supertest でHTTPレイヤーからテスト

### テストの耐久性（重要）

**エラーメッセージなどの文字列は assertion しない**。テストが脆くなり、文言の変更・i18n 対応・ログ改善のたびに無関係なテストが落ちるため。

#### してはいけない例

```typescript
// ❌ メッセージの文言に依存した assertion
await expect(uploadCsv(...)).rejects.toThrow("このCSVファイルはすでにアップロード済みです")
expect(res.body.error).toBe("Invalid memo ID")
expect(result.error.message).toContain("すでに")
```

#### 推奨される assertion

**Service のユニットテスト**: Result 型の構造（`ok` / `statusCode` / `type`）のみを検証

```typescript
// ✅ Result 型の構造のみ検証（文言は見ない）
const result = await uploadCsv(...)
expect(result.ok).toBe(false)
if (!result.ok) {
  expect(result.error.statusCode).toBe(409)
  expect(result.error.type).toBe("CONFLICT")
}

// ✅ 想定外の例外（DB 障害等）は throw の有無のみ検証
await expect(uploadCsv(...)).rejects.toThrow()  // メッセージは引数に渡さない
```

**Controller のインテグレーションテスト**: HTTP ステータスコードとレスポンスボディの「定義されているか」のみを検証

```typescript
// ✅ ステータスコードと error フィールドの存在のみ
expect(res.status).toBe(400)
expect(res.body.error).toBeDefined()

// ❌ エラー文言を照合しない
// expect(res.body.error).toBe("Invalid memo ID")
```

#### この方針の理由

1. **リファクタリング耐性**: 文言の改善・ログ改修・i18n 対応でテストが落ちない
2. **レビュー負荷軽減**: 文言変更のたびにテストを更新する必要がない
3. **網羅性と独立性**: 「何が起きたか」は `statusCode` / `type` で構造的に表現されるべきで、文字列で表現するのは表現が弱い
4. **AI/自動化フレンドリー**: 文言に例外を作らないため、AI による自動リファクタリングで誤検知が起きにくい

### ユニットテスト（Service）

Service のユニットテストは以下の3原則を守る。

1. **変更に強い**: 入出力が変わらない限りテストも成功する
2. **すぐにテストできる**: 準備や実行順序に縛られない
3. **並列実行可能**: 他のテストと独立して実行できる

#### mockの方針

- **デフォルトは `jest.fn()` を使用する**。interface に基づいたオブジェクトを `jest.fn()` で作成し、引数として渡す
- **自作 Fake（例: `InMemoryXxxRepository`）は、テスト内で状態の読み書きが複数回絡む場合のみ検討する**。通常のserviceテストでは不要

```typescript
// 基本パターン: jest.fn() でmockを作成し、引数で渡す
const mockFindById = jest.fn()
const mockUserRepository = {
  findById: mockFindById,
}

mockFindById.mockResolvedValue(mockUser)
const result = await getUserById(1, mockUserRepository as any)
```

#### `jest.fn()` と `jest.mock()` の使い分け

| 方法 | 対象 | テストへの影響 | 本プロジェクトでの方針 |
|---|---|---|---|
| `jest.fn()` | 単一の関数。変数に代入して引数経由で渡す | import パスに依存しない。リファクタリング耐性が高い | **推奨** |
| `jest.mock()` | モジュール全体。`import`/`require` の解決自体を差し替える | テストがモジュールのファイルパスに結合する。リファクタリング耐性が低い | **非推奨** |

**本プロジェクトでは Service 層の全ての外部依存を引数（DI）で受け取る設計のため、`jest.mock()` は原則使用しない。**

`jest.mock()` はテスト対象が直接 `import` している内部モジュールを差し替える仕組みであり、テストがファイルパスという実装の詳細に依存する。依存を引数で渡す設計にすれば `jest.fn()` だけでテストが完結し、ファイル移動やリネーム時にテストが壊れない。

参考: [Jest公式 - Mock Functions](https://jestjs.io/docs/mock-functions)

#### テストケースの観点

- 正常系（期待通りの入力 → 期待通りの出力）
- 異常系（データなし → null / エラー → throw）
- 依存の呼び出し検証（正しい引数で呼ばれたか）

### インテグレーションテスト（Controller）

ユニットテストで検証できない以下の項目をテストする。

- **controllerが返すレスポンスの全パターン**: 正常系・異常系のHTTPステータスコードとレスポンスボディ
- **最終的なDBの状態**: データの作成・更新・削除が正しく反映されているか

※ 認証ミドルウェア単体のテストやリクエストバリデーション単体のテストは行わない。あくまでcontrollerのレスポンスパターンを網羅することで、これらも含めて検証する。

#### テスト用DB

- 開発用と同じDBコンテナ内にテスト用データベースを作成する（コンテナを分けない）
- インテグレーションテストはドメイン単位でデータベースを分割可能にし、並列実行やCI での分割実行に対応する
- 各テストケースの `beforeEach` / `afterEach` で初期データの投入とクリーンアップを必ず行い、テスト間の独立性を保証する

#### テストの実行

```bash
# ユニットテストのみ（DB不要）
pnpm test test/service

# インテグレーションテストのみ（DB必要）
pnpm test test/controller

# 全テスト
pnpm test
```

## 開発コマンド

```bash
# 開発サーバー起動（ホットリロード）
pnpm dev

# ビルド
pnpm build

# 本番サーバー起動
pnpm start

# リント
pnpm lint
pnpm lint:fix
```

## Prisma コマンド

```bash
# マイグレーションファイルの作成・実行
cd src/prisma
npx prisma migrate dev --name <migration名>

# クライアントの生成
cd src/prisma
npx prisma generate

# シードの実行
cd src/prisma
npx prisma db seed

# Studio の起動
npx prisma studio --url postgresql://postgres:password@localhost:5432/ai_trainer_dev
```
