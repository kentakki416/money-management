# Step1: DB設計・マイグレーション

Prismaスキーマに新規テーブルを追加し、マイグレーションを実行する。

## 対応内容

### 1. Prismaスキーマへのモデル追加

`apps/api/src/prisma/schema.prisma` に以下のモデルを追加する。

```prisma
// 支払い元タイプ
enum PaymentSourceType {
    SMBC
    MUFG
    PAYPAY
    MANUAL
}

// 支払い元（ユーザーごとの決済手段）
model PaymentSource {
    id        Int               @id @default(autoincrement())
    userId    Int               @map("user_id")
    name      String            @db.VarChar(100)
    type      PaymentSourceType
    createdAt DateTime          @default(now()) @map("created_at")
    updatedAt DateTime          @updatedAt @map("updated_at")

    user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
    transactions Transaction[]
    csvUploads   CsvUpload[]

    @@index([userId])
    @@map("payment_sources")
}

// カテゴリマスター（グローバル共通）
model Category {
    id        Int      @id @default(autoincrement())
    name      String   @db.VarChar(50)
    color     String   @db.VarChar(7) // #RRGGBB
    sortOrder Int      @default(0) @map("sort_order")
    createdAt DateTime @default(now()) @map("created_at")
    updatedAt DateTime @updatedAt @map("updated_at")

    transactions  Transaction[]
    categoryRules CategoryRule[]

    @@map("categories")
}

// 自動分類ルールのマッチタイプ
enum MatchType {
    PARTIAL
    EXACT
}

// 自動分類ルール
model CategoryRule {
    id         Int       @id @default(autoincrement())
    categoryId Int       @map("category_id")
    keyword    String    @db.VarChar(200)
    matchType  MatchType @default(PARTIAL) @map("match_type")
    priority   Int       @default(0)
    createdAt  DateTime  @default(now()) @map("created_at")
    updatedAt  DateTime  @updatedAt @map("updated_at")

    category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

    @@index([categoryId])
    @@index([priority])
    @@map("category_rules")
}

// CSVアップロード履歴
model CsvUpload {
    id              Int      @id @default(autoincrement())
    userId          Int      @map("user_id")
    paymentSourceId Int      @map("payment_source_id")
    fileName        String   @db.VarChar(255) @map("file_name")
    fileHash        String   @unique @db.VarChar(64) @map("file_hash")
    rowCount        Int      @map("row_count")
    uploadedAt      DateTime @default(now()) @map("uploaded_at")

    user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
    paymentSource PaymentSource @relation(fields: [paymentSourceId], references: [id], onDelete: Cascade)
    transactions  Transaction[]

    @@index([userId])
    @@index([fileHash])
    @@map("csv_uploads")
}

// 取引データ
model Transaction {
    id              Int      @id @default(autoincrement())
    userId          Int      @map("user_id")
    paymentSourceId Int      @map("payment_source_id")
    categoryId      Int?     @map("category_id")
    csvUploadId     Int?     @map("csv_upload_id")
    transactionDate DateTime @map("transaction_date") @db.Date
    description     String   @db.VarChar(500)
    amount          Int
    isManual        Boolean  @default(false) @map("is_manual")
    createdAt       DateTime @default(now()) @map("created_at")
    updatedAt       DateTime @updatedAt @map("updated_at")

    user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
    paymentSource PaymentSource  @relation(fields: [paymentSourceId], references: [id], onDelete: Cascade)
    category      Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
    csvUpload     CsvUpload?     @relation(fields: [csvUploadId], references: [id], onDelete: SetNull)

    @@index([userId, transactionDate])
    @@index([userId, categoryId, transactionDate])
    @@index([csvUploadId])
    @@map("transactions")
}
```

### 2. 既存Userモデルにリレーション追加

`User` モデルに以下のリレーションフィールドを追加する。

```prisma
model User {
    // ... 既存フィールド ...

    // 既存リレーション
    accounts       AuthAccount[]
    userCharacters UserCharacter[]

    // 追加リレーション
    paymentSources PaymentSource[]
    transactions   Transaction[]
    csvUploads     CsvUpload[]

    @@map("users")
}
```

### 3. マイグレーション実行

```bash
cd apps/api
npx prisma migrate dev --name add_money_management_tables
```

### 4. シードデータ作成

`apps/api/src/prisma/seed.ts` を作成し、カテゴリとルールの初期データを投入する。

```typescript
import { PrismaClient } from "./generated"

const prisma = new PrismaClient()

const categories = [
  { id: 1, name: "飲食", color: "#FF6384", sortOrder: 1 },
  { id: 2, name: "交通", color: "#36A2EB", sortOrder: 2 },
  { id: 3, name: "美容・医療", color: "#FFCE56", sortOrder: 3 },
  { id: 4, name: "日用品", color: "#4BC0C0", sortOrder: 4 },
  { id: 5, name: "ショッピング", color: "#9966FF", sortOrder: 5 },
  { id: 6, name: "エンタメ", color: "#FF9F40", sortOrder: 6 },
  { id: 7, name: "通信・サブスク", color: "#C9CBCF", sortOrder: 7 },
  { id: 8, name: "光熱費", color: "#7BC8A4", sortOrder: 8 },
  { id: 9, name: "住居", color: "#E7E9ED", sortOrder: 9 },
  { id: 10, name: "送金・その他", color: "#8B8D91", sortOrder: 10 },
  { id: 99, name: "未分類", color: "#CCCCCC", sortOrder: 99 },
]

const categoryRules = [
  // 飲食
  { categoryId: 1, keyword: "スターバックス", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "サンマルクカフェ", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "マクドナルド", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "セブン-イレブン", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "まいばすけっと", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "ピーコックストア", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "鳥貴族", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "ワンカルビ", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 1, keyword: "ふたご", matchType: "PARTIAL" as const, priority: 10 },
  // 交通
  { categoryId: 2, keyword: "Suica", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 2, keyword: "タクシー", matchType: "PARTIAL" as const, priority: 10 },
  // 美容・医療
  { categoryId: 3, keyword: "クリニック", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 3, keyword: "医療法人", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 3, keyword: "OCEAN TOKYO", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 3, keyword: "メイクマン", matchType: "PARTIAL" as const, priority: 10 },
  // ショッピング
  { categoryId: 5, keyword: "ユニクロ", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 5, keyword: "ZOZOTOWN", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 5, keyword: "AMAZON", matchType: "PARTIAL" as const, priority: 5 },
  { categoryId: 5, keyword: "Amazon", matchType: "PARTIAL" as const, priority: 5 },
  { categoryId: 5, keyword: "ケーズデンキ", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 5, keyword: "アイハーブ", matchType: "PARTIAL" as const, priority: 10 },
  // エンタメ
  { categoryId: 6, keyword: "カラオケ館", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 6, keyword: "HAKADORU", matchType: "PARTIAL" as const, priority: 10 },
  // 通信・サブスク
  { categoryId: 7, keyword: "APPLE COM BILL", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 7, keyword: "APPLE.COM/BILL", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 7, keyword: "CLAUDE.AI", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 7, keyword: "Amazonプライム", matchType: "PARTIAL" as const, priority: 20 },
  { categoryId: 7, keyword: "AWS", matchType: "PARTIAL" as const, priority: 10 },
  // 光熱費
  { categoryId: 8, keyword: "東京ガス", matchType: "PARTIAL" as const, priority: 10 },
  // 日用品
  { categoryId: 4, keyword: "ChargeSPOT", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 4, keyword: "ヤマト運輸", matchType: "PARTIAL" as const, priority: 10 },
  // 送金・その他
  { categoryId: 10, keyword: "送った金額", matchType: "PARTIAL" as const, priority: 10 },
  { categoryId: 10, keyword: "チャージ", matchType: "EXACT" as const, priority: 10 },
]

const seed = async () => {
  console.log("Seeding categories...")
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, color: cat.color, sortOrder: cat.sortOrder },
      create: cat,
    })
  }

  console.log("Seeding category rules...")
  // 既存ルールを全削除してから再投入
  await prisma.categoryRule.deleteMany()
  for (const rule of categoryRules) {
    await prisma.categoryRule.create({ data: rule })
  }

  console.log("Seed completed.")
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### 5. package.json にシードコマンド追加

`apps/api/package.json` に以下を追加:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} src/prisma/seed.ts"
  }
}
```

シード実行:

```bash
cd apps/api
npx prisma db seed
```

## 動作確認

### マイグレーション確認

```bash
cd apps/api
npx prisma migrate status
```

全マイグレーションが適用済みであることを確認する。

### テーブル確認

```bash
npx prisma studio
```

Prisma Studioでブラウザから以下を確認:
- `categories` テーブルに11件のカテゴリが存在
- `category_rules` テーブルに初期ルールが存在
- `payment_sources`, `csv_uploads`, `transactions` テーブルが空で存在

### 型生成確認

```bash
npx prisma generate
```

`apps/api/src/prisma/generated/` にクライアントが正常に生成されることを確認。
