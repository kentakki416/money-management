# Step5: API - 取引CRUD・CSVアップロード

取引データのCRUD API と CSVアップロード機能を実装する。

## 対応内容

### 1. 自動カテゴリ分類サービス

`apps/api/src/service/categorize-service.ts` を作成:

```typescript
import { PrismaCategoryRuleRepository } from "../repository/mysql/prisma-category-rule-repository"
import { PrismaUserCategoryRuleRepository } from "../repository/mysql/prisma-user-category-rule-repository"
import { convertFullWidthToHalfWidth } from "../utils/normalize"

const UNCATEGORIZED_ID = 99

type RuleLike = {
  categoryId: number
  keyword: string
  matchType: "PARTIAL" | "EXACT"
}

/**
 * ルール配列に対して description をマッチングする共通関数
 */
const matchRules = (normalizedDesc: string, rules: RuleLike[]): number | null => {
  for (const rule of rules) {
    const normalizedKeyword = convertFullWidthToHalfWidth(rule.keyword)
    if (rule.matchType === "EXACT") {
      if (normalizedDesc === normalizedKeyword) {
        return rule.categoryId
      }
    } else {
      if (normalizedDesc.includes(normalizedKeyword)) {
        return rule.categoryId
      }
    }
  }
  return null
}

export const createCategorizeService = (
  masterRuleRepo: PrismaCategoryRuleRepository,
  userRuleRepo: PrismaUserCategoryRuleRepository,
) => ({
  /**
   * 支払先名(description)からカテゴリIDを判定する
   * 1. ユーザールール（user_category_rules）を先に照合
   * 2. マッチしなければマスタールール（category_rules）を照合
   * 3. どちらにもマッチしなければ「未分類」
   */
  categorize: async (description: string, userId: number): Promise<number> => {
    const normalizedDesc = convertFullWidthToHalfWidth(description)

    // ユーザールールを先にチェック
    const userRules = await userRuleRepo.findByUserId(userId)
    const userMatch = matchRules(normalizedDesc, userRules)
    if (userMatch !== null) return userMatch

    // マスタールールをチェック
    const masterRules = await masterRuleRepo.findAll()
    const masterMatch = matchRules(normalizedDesc, masterRules)
    if (masterMatch !== null) return masterMatch

    return UNCATEGORIZED_ID
  },

  /**
   * 複数の取引に対してカテゴリを一括判定する
   */
  categorizeMany: async (descriptions: string[], userId: number): Promise<Map<string, number>> => {
    const userRules = await userRuleRepo.findByUserId(userId)
    const masterRules = await masterRuleRepo.findAll()
    const result = new Map<string, number>()

    for (const desc of descriptions) {
      const normalizedDesc = convertFullWidthToHalfWidth(desc)

      // ユーザールール優先
      const userMatch = matchRules(normalizedDesc, userRules)
      if (userMatch !== null) {
        result.set(desc, userMatch)
        continue
      }

      // マスタールール
      const masterMatch = matchRules(normalizedDesc, masterRules)
      result.set(desc, masterMatch ?? UNCATEGORIZED_ID)
    }

    return result
  },
})

export type CategorizeService = ReturnType<typeof createCategorizeService>
```

### 2. 支払い元 Repository

`apps/api/src/repository/mysql/prisma-payment-source-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated"

export type PaymentSourceData = {
  id: number
  name: string
  type: string
  userId: number
}

export const createPrismaPaymentSourceRepository = (prisma: PrismaClient) => ({
  create: async (input: { name: string; type: string; userId: number }): Promise<PaymentSourceData> => {
    const source = await prisma.paymentSource.create({ data: input })
    return { id: source.id, name: source.name, type: source.type, userId: source.userId }
  },

  delete: async (id: number, userId: number): Promise<void> => {
    await prisma.paymentSource.deleteMany({ where: { id, userId } })
  },

  findByUserId: async (userId: number): Promise<PaymentSourceData[]> => {
    const sources = await prisma.paymentSource.findMany({
      orderBy: { createdAt: "desc" },
      where: { userId },
    })
    return sources.map((s) => ({ id: s.id, name: s.name, type: s.type, userId: s.userId }))
  },
})

export type PrismaPaymentSourceRepository = ReturnType<typeof createPrismaPaymentSourceRepository>
```

### 3. 取引 Repository

`apps/api/src/repository/mysql/prisma-transaction-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated"

export type TransactionData = {
  amount: number
  categoryColor: string | null
  categoryId: number | null
  categoryName: string | null
  createdAt: Date
  csvUploadId: number | null
  description: string
  id: number
  isManual: boolean
  paymentSourceId: number
  paymentSourceName: string
  transactionDate: Date
  updatedAt: Date
  userId: number
}

export type TransactionFilter = {
  categoryId?: number
  date?: string       // YYYY-MM-DD
  month?: number
  userId: number
  year?: number
}

export type CreateTransactionInput = {
  amount: number
  categoryId?: number | null
  csvUploadId?: number | null
  description: string
  isManual: boolean
  paymentSourceId: number
  transactionDate: Date
  userId: number
}

export const createPrismaTransactionRepository = (prisma: PrismaClient) => ({
  create: async (input: CreateTransactionInput): Promise<TransactionData> => {
    const tx = await prisma.transaction.create({
      data: {
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        csvUploadId: input.csvUploadId ?? null,
        description: input.description,
        isManual: input.isManual,
        paymentSourceId: input.paymentSourceId,
        transactionDate: input.transactionDate,
        userId: input.userId,
      },
      include: {
        category: true,
        paymentSource: true,
      },
    })
    return mapTransaction(tx)
  },

  createMany: async (inputs: CreateTransactionInput[]): Promise<number> => {
    const result = await prisma.transaction.createMany({
      data: inputs.map((input) => ({
        amount: input.amount,
        categoryId: input.categoryId ?? null,
        csvUploadId: input.csvUploadId ?? null,
        description: input.description,
        isManual: input.isManual,
        paymentSourceId: input.paymentSourceId,
        transactionDate: input.transactionDate,
        userId: input.userId,
      })),
    })
    return result.count
  },

  delete: async (id: number, userId: number): Promise<void> => {
    await prisma.transaction.deleteMany({ where: { id, userId } })
  },

  findByFilter: async (filter: TransactionFilter): Promise<TransactionData[]> => {
    const where: Record<string, unknown> = { userId: filter.userId }

    if (filter.date) {
      where.transactionDate = new Date(filter.date)
    } else if (filter.year && filter.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1)
      const endDate = new Date(filter.year, filter.month, 0) // 月末
      where.transactionDate = { gte: startDate, lte: endDate }
    }

    if (filter.categoryId) {
      where.categoryId = filter.categoryId
    }

    const transactions = await prisma.transaction.findMany({
      include: { category: true, paymentSource: true },
      orderBy: { transactionDate: "desc" },
      where,
    })
    return transactions.map(mapTransaction)
  },

  update: async (id: number, userId: number, input: {
    amount?: number
    categoryId?: number | null
    description?: string
    transactionDate?: Date
  }): Promise<TransactionData> => {
    const tx = await prisma.transaction.update({
      data: input,
      include: { category: true, paymentSource: true },
      where: { id, userId },
    })
    return mapTransaction(tx)
  },
})

const mapTransaction = (tx: {
  amount: number
  category: { color: string; name: string } | null
  categoryId: number | null
  createdAt: Date
  csvUploadId: number | null
  description: string
  id: number
  isManual: boolean
  paymentSource: { name: string }
  paymentSourceId: number
  transactionDate: Date
  updatedAt: Date
  userId: number
}): TransactionData => ({
  amount: tx.amount,
  categoryColor: tx.category?.color ?? null,
  categoryId: tx.categoryId,
  categoryName: tx.category?.name ?? null,
  createdAt: tx.createdAt,
  csvUploadId: tx.csvUploadId,
  description: tx.description,
  id: tx.id,
  isManual: tx.isManual,
  paymentSourceId: tx.paymentSourceId,
  paymentSourceName: tx.paymentSource.name,
  transactionDate: tx.transactionDate,
  updatedAt: tx.updatedAt,
  userId: tx.userId,
})

export type PrismaTransactionRepository = ReturnType<typeof createPrismaTransactionRepository>
```

### 4. CSVアップロード Repository

`apps/api/src/repository/mysql/prisma-csv-upload-repository.ts` を作成:

```typescript
import { PrismaClient } from "../../prisma/generated"

export type CsvUploadData = {
  fileHash: string
  fileName: string
  id: number
  paymentSourceId: number
  paymentSourceName: string
  rowCount: number
  uploadedAt: Date
  userId: number
}

export const createPrismaCsvUploadRepository = (prisma: PrismaClient) => ({
  create: async (input: {
    fileHash: string
    fileName: string
    paymentSourceId: number
    rowCount: number
    userId: number
  }): Promise<CsvUploadData> => {
    const upload = await prisma.csvUpload.create({
      data: input,
      include: { paymentSource: true },
    })
    return {
      fileHash: upload.fileHash,
      fileName: upload.fileName,
      id: upload.id,
      paymentSourceId: upload.paymentSourceId,
      paymentSourceName: upload.paymentSource.name,
      rowCount: upload.rowCount,
      uploadedAt: upload.uploadedAt,
      userId: upload.userId,
    }
  },

  existsByHash: async (fileHash: string): Promise<boolean> => {
    const count = await prisma.csvUpload.count({ where: { fileHash } })
    return count > 0
  },

  findByUserId: async (userId: number): Promise<CsvUploadData[]> => {
    const uploads = await prisma.csvUpload.findMany({
      include: { paymentSource: true },
      orderBy: { uploadedAt: "desc" },
      where: { userId },
    })
    return uploads.map((u) => ({
      fileHash: u.fileHash,
      fileName: u.fileName,
      id: u.id,
      paymentSourceId: u.paymentSourceId,
      paymentSourceName: u.paymentSource.name,
      rowCount: u.rowCount,
      uploadedAt: u.uploadedAt,
      userId: u.userId,
    }))
  },
})

export type PrismaCsvUploadRepository = ReturnType<typeof createPrismaCsvUploadRepository>
```

### 5. 取引 Service

`apps/api/src/service/transaction-service.ts` を作成:

```typescript
import { PrismaTransactionRepository, TransactionFilter } from "../repository/mysql/prisma-transaction-repository"
import { PrismaUserCategoryRuleRepository } from "../repository/mysql/prisma-user-category-rule-repository"
import { CategorizeService } from "./categorize-service"

export const createTransactionService = (
  txRepo: PrismaTransactionRepository,
  categorizeService: CategorizeService,
  userRuleRepo: PrismaUserCategoryRuleRepository,
) => ({
  createManualTransaction: async (input: {
    amount: number
    categoryId?: number
    description: string
    paymentSourceId: number
    transactionDate: string
    userId: number
  }) => {
    // カテゴリ未指定の場合は自動分類（ユーザールール優先）
    const categoryId = input.categoryId ?? await categorizeService.categorize(input.description, input.userId)

    return txRepo.create({
      amount: input.amount,
      categoryId,
      description: input.description,
      isManual: true,
      paymentSourceId: input.paymentSourceId,
      transactionDate: new Date(input.transactionDate),
      userId: input.userId,
    })
  },

  deleteTransaction: async (id: number, userId: number) => {
    return txRepo.delete(id, userId)
  },

  getTransactions: async (filter: TransactionFilter) => {
    return txRepo.findByFilter(filter)
  },

  updateTransaction: async (id: number, userId: number, input: {
    amount?: number
    categoryId?: number | null
    description?: string
    transactionDate?: string
  }) => {
    const transaction = await txRepo.update(id, userId, {
      amount: input.amount,
      categoryId: input.categoryId,
      description: input.description,
      transactionDate: input.transactionDate ? new Date(input.transactionDate) : undefined,
    })

    // カテゴリが変更された場合、ユーザー個別ルールを自動作成・更新
    // 以降同じ店名の取引が自動で同じカテゴリに分類されるようになる
    if (input.categoryId !== undefined && input.categoryId !== null) {
      await userRuleRepo.upsert({
        categoryId: input.categoryId,
        keyword: transaction.description,
        userId,
      })
    }

    return transaction
  },
})

export type TransactionService = ReturnType<typeof createTransactionService>
```

### 6. CSVアップロード Service

`apps/api/src/service/csv-upload-service.ts` を作成:

```typescript
import crypto from "crypto"

import { PaymentSourceType } from "@repo/api-schema"

import { PrismaCsvUploadRepository } from "../repository/mysql/prisma-csv-upload-repository"
import { PrismaTransactionRepository } from "../repository/mysql/prisma-transaction-repository"
import { CategorizeService } from "./categorize-service"
import { getCsvParser } from "./csv-parser"

export const createCsvUploadService = (
  csvUploadRepo: PrismaCsvUploadRepository,
  txRepo: PrismaTransactionRepository,
  categorizeService: CategorizeService,
) => ({
  getUploadHistory: async (userId: number) => {
    return csvUploadRepo.findByUserId(userId)
  },

  uploadCsv: async (input: {
    fileContent: string
    fileName: string
    paymentSourceId: number
    paymentSourceType: PaymentSourceType
    userId: number
  }) => {
    // ファイルハッシュの計算
    const fileHash = crypto
      .createHash("sha256")
      .update(input.fileContent)
      .digest("hex")

    // 重複チェック
    const exists = await csvUploadRepo.existsByHash(fileHash)
    if (exists) {
      throw new CsvDuplicateError("このCSVは既にアップロード済みです")
    }

    // CSVパース
    const parser = getCsvParser(input.paymentSourceType)
    const parsed = parser(input.fileContent)

    if (parsed.length === 0) {
      throw new CsvParseError("取引データが見つかりませんでした")
    }

    // 自動カテゴリ分類（ユーザールール優先）
    const descriptions = parsed.map((t) => t.description)
    const categoryMap = await categorizeService.categorizeMany(descriptions, input.userId)

    // CSVアップロードレコード作成
    const csvUpload = await csvUploadRepo.create({
      fileHash,
      fileName: input.fileName,
      paymentSourceId: input.paymentSourceId,
      rowCount: parsed.length,
      userId: input.userId,
    })

    // 取引データ一括登録
    const transactionInputs = parsed.map((t) => ({
      amount: t.amount,
      categoryId: categoryMap.get(t.description) ?? 99,
      csvUploadId: csvUpload.id,
      description: t.description,
      isManual: false,
      paymentSourceId: input.paymentSourceId,
      transactionDate: t.transactionDate,
      userId: input.userId,
    }))

    const importedCount = await txRepo.createMany(transactionInputs)

    return {
      csvUpload,
      importedCount,
    }
  },
})

export class CsvDuplicateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CsvDuplicateError"
  }
}

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CsvParseError"
  }
}

export type CsvUploadService = ReturnType<typeof createCsvUploadService>
```

### 7. 取引 Controller

`apps/api/src/controller/transaction/list.ts`:

```typescript
import { Request, Response } from "express"
import { getTransactionListResponseSchema } from "@repo/api-schema"
import { TransactionService } from "../../service/transaction-service"

export const createListTransactionsController = (service: TransactionService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id // 認証ミドルウェアから取得
    const { category_id, date, month, payment_source_id, year } = req.query

    const transactions = await service.getTransactions({
      categoryId: category_id ? Number(category_id) : undefined,
      date: date as string | undefined,
      month: month ? Number(month) : undefined,
      userId,
      year: year ? Number(year) : undefined,
    })

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

    const response = getTransactionListResponseSchema.parse({
      total_amount: totalAmount,
      transactions: transactions.map((t) => ({
        amount: t.amount,
        category_color: t.categoryColor,
        category_id: t.categoryId,
        category_name: t.categoryName,
        created_at: t.createdAt.toISOString(),
        csv_upload_id: t.csvUploadId,
        description: t.description,
        id: t.id,
        is_manual: t.isManual,
        payment_source_id: t.paymentSourceId,
        payment_source_name: t.paymentSourceName,
        transaction_date: t.transactionDate.toISOString().split("T")[0],
        updated_at: t.updatedAt.toISOString(),
        user_id: t.userId,
      })),
    })

    res.json(response)
  }
```

`apps/api/src/controller/transaction/create.ts`:

```typescript
import { Request, Response } from "express"
import { createTransactionRequestSchema, createTransactionResponseSchema } from "@repo/api-schema"
import { TransactionService } from "../../service/transaction-service"

export const createCreateTransactionController = (service: TransactionService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const input = createTransactionRequestSchema.parse(req.body)

    const transaction = await service.createManualTransaction({
      amount: input.amount,
      categoryId: input.category_id,
      description: input.description,
      paymentSourceId: input.payment_source_id,
      transactionDate: input.transaction_date,
      userId,
    })

    const response = createTransactionResponseSchema.parse({
      transaction: {
        amount: transaction.amount,
        category_color: transaction.categoryColor,
        category_id: transaction.categoryId,
        category_name: transaction.categoryName,
        created_at: transaction.createdAt.toISOString(),
        csv_upload_id: transaction.csvUploadId,
        description: transaction.description,
        id: transaction.id,
        is_manual: transaction.isManual,
        payment_source_id: transaction.paymentSourceId,
        payment_source_name: transaction.paymentSourceName,
        transaction_date: transaction.transactionDate.toISOString().split("T")[0],
        updated_at: transaction.updatedAt.toISOString(),
        user_id: transaction.userId,
      },
    })

    res.status(201).json(response)
  }
```

`apps/api/src/controller/transaction/update.ts`:

```typescript
import { Request, Response } from "express"
import { updateTransactionRequestSchema, updateTransactionResponseSchema } from "@repo/api-schema"
import { TransactionService } from "../../service/transaction-service"

export const createUpdateTransactionController = (service: TransactionService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const id = parseInt(req.params.id, 10)
    const input = updateTransactionRequestSchema.parse(req.body)

    const transaction = await service.updateTransaction(id, userId, {
      amount: input.amount,
      categoryId: input.category_id,
      description: input.description,
      transactionDate: input.transaction_date,
    })

    const response = updateTransactionResponseSchema.parse({
      transaction: {
        amount: transaction.amount,
        category_color: transaction.categoryColor,
        category_id: transaction.categoryId,
        category_name: transaction.categoryName,
        created_at: transaction.createdAt.toISOString(),
        csv_upload_id: transaction.csvUploadId,
        description: transaction.description,
        id: transaction.id,
        is_manual: transaction.isManual,
        payment_source_id: transaction.paymentSourceId,
        payment_source_name: transaction.paymentSourceName,
        transaction_date: transaction.transactionDate.toISOString().split("T")[0],
        updated_at: transaction.updatedAt.toISOString(),
        user_id: transaction.userId,
      },
    })

    res.json(response)
  }
```

`apps/api/src/controller/transaction/delete.ts`:

```typescript
import { Request, Response } from "express"
import { TransactionService } from "../../service/transaction-service"

export const createDeleteTransactionController = (service: TransactionService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const id = parseInt(req.params.id, 10)
    await service.deleteTransaction(id, userId)
    res.json({ success: true })
  }
```

### 8. CSVアップロード Controller

`apps/api/src/controller/csv-upload/upload.ts`:

```typescript
import { Request, Response } from "express"
import { CsvUploadService, CsvDuplicateError, CsvParseError } from "../../service/csv-upload-service"

export const createUploadCsvController = (service: CsvUploadService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id

    // multerでアップロードされたファイル
    const file = req.file
    if (!file) {
      res.status(400).json({ error: "ファイルが指定されていません", status_code: 400 })
      return
    }

    const paymentSourceId = parseInt(req.body.payment_source_id, 10)
    const paymentSourceType = req.body.payment_source_type // "SMBC" | "MUFG" | "PAYPAY"

    if (!paymentSourceId || !paymentSourceType) {
      res.status(400).json({ error: "支払い元情報が不足しています", status_code: 400 })
      return
    }

    try {
      const fileContent = file.buffer.toString("utf-8")

      const result = await service.uploadCsv({
        fileContent,
        fileName: file.originalname,
        paymentSourceId,
        paymentSourceType,
        userId,
      })

      res.status(201).json({
        csv_upload: {
          file_hash: result.csvUpload.fileHash,
          file_name: result.csvUpload.fileName,
          id: result.csvUpload.id,
          payment_source_id: result.csvUpload.paymentSourceId,
          payment_source_name: result.csvUpload.paymentSourceName,
          row_count: result.csvUpload.rowCount,
          uploaded_at: result.csvUpload.uploadedAt.toISOString(),
          user_id: result.csvUpload.userId,
        },
        imported_count: result.importedCount,
      })
    } catch (error) {
      if (error instanceof CsvDuplicateError) {
        res.status(409).json({ error: error.message, status_code: 409 })
        return
      }
      if (error instanceof CsvParseError) {
        res.status(400).json({ error: error.message, status_code: 400 })
        return
      }
      throw error
    }
  }
```

`apps/api/src/controller/csv-upload/list.ts`:

```typescript
import { Request, Response } from "express"
import { getCsvUploadListResponseSchema } from "@repo/api-schema"
import { CsvUploadService } from "../../service/csv-upload-service"

export const createListCsvUploadsController = (service: CsvUploadService) =>
  async (req: Request, res: Response) => {
    const userId = req.user!.id
    const uploads = await service.getUploadHistory(userId)

    const response = getCsvUploadListResponseSchema.parse({
      csv_uploads: uploads.map((u) => ({
        file_hash: u.fileHash,
        file_name: u.fileName,
        id: u.id,
        payment_source_id: u.paymentSourceId,
        payment_source_name: u.paymentSourceName,
        row_count: u.rowCount,
        uploaded_at: u.uploadedAt.toISOString(),
        user_id: u.userId,
      })),
    })

    res.json(response)
  }
```

### 9. ルーター登録

`apps/api/src/routes/transaction-router.ts`:

```typescript
import { Router } from "express"

import { createCreateTransactionController } from "../controller/transaction/create"
import { createDeleteTransactionController } from "../controller/transaction/delete"
import { createListTransactionsController } from "../controller/transaction/list"
import { createUpdateTransactionController } from "../controller/transaction/update"
import { TransactionService } from "../service/transaction-service"

export const createTransactionRouter = (service: TransactionService): Router => {
  const router = Router()

  router.get("/", createListTransactionsController(service))
  router.post("/", createCreateTransactionController(service))
  router.put("/:id", createUpdateTransactionController(service))
  router.delete("/:id", createDeleteTransactionController(service))

  return router
}
```

`apps/api/src/routes/csv-upload-router.ts`:

```typescript
import { Router } from "express"
import multer from "multer"

import { createListCsvUploadsController } from "../controller/csv-upload/list"
import { createUploadCsvController } from "../controller/csv-upload/upload"
import { CsvUploadService } from "../service/csv-upload-service"

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  storage: multer.memoryStorage(),
})

export const createCsvUploadRouter = (service: CsvUploadService): Router => {
  const router = Router()

  router.post("/", upload.single("file"), createUploadCsvController(service))
  router.get("/", createListCsvUploadsController(service))

  return router
}
```

### 10. multer パッケージ追加

```bash
cd apps/api
pnpm add multer
pnpm add -D @types/multer
```

### 11. index.ts にルート追加

`apps/api/src/index.ts` に以下を追加:

```typescript
import { createTransactionRouter } from "./routes/transaction-router"
import { createCsvUploadRouter } from "./routes/csv-upload-router"
import { createPrismaTransactionRepository } from "./repository/mysql/prisma-transaction-repository"
import { createPrismaCsvUploadRepository } from "./repository/mysql/prisma-csv-upload-repository"
import { createPrismaPaymentSourceRepository } from "./repository/mysql/prisma-payment-source-repository"
import { createTransactionService } from "./service/transaction-service"
import { createCsvUploadService } from "./service/csv-upload-service"
import { createCategorizeService } from "./service/categorize-service"
import { createPrismaUserCategoryRuleRepository } from "./repository/mysql/prisma-user-category-rule-repository"

// リポジトリ
const txRepo = createPrismaTransactionRepository(prisma)
const csvUploadRepo = createPrismaCsvUploadRepository(prisma)
const paymentSourceRepo = createPrismaPaymentSourceRepository(prisma)

// サービス
const userCategoryRuleRepo = createPrismaUserCategoryRuleRepository(prisma)
const categorizeService = createCategorizeService(categoryRuleRepo, userCategoryRuleRepo)
const transactionService = createTransactionService(txRepo, categorizeService, userCategoryRuleRepo)
const csvUploadService = createCsvUploadService(csvUploadRepo, txRepo, categorizeService)

// ルート登録
app.use("/api/transactions", createTransactionRouter(transactionService))
app.use("/api/csv-upload", createCsvUploadRouter(csvUploadService))
app.use("/api/csv-uploads", createCsvUploadRouter(csvUploadService)) // GET用エイリアス
```

## 動作確認

### CSVアップロードテスト

```bash
# 支払い元を先に作成
curl -X POST http://localhost:8080/api/payment-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"三井住友カード","type":"SMBC"}'

# CSVアップロード
curl -X POST http://localhost:8080/api/csv-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@data/smbc-202603.csv" \
  -F "payment_source_id=1" \
  -F "payment_source_type=SMBC"

# 取引一覧確認
curl "http://localhost:8080/api/transactions?year=2026&month=2" \
  -H "Authorization: Bearer <token>"

# 手動取引登録
curl -X POST http://localhost:8080/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"description":"ランチ","amount":1200,"transaction_date":"2026-03-15","payment_source_id":1}'

# 重複CSVアップロード（409エラーを確認）
curl -X POST http://localhost:8080/api/csv-upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@data/smbc-202603.csv" \
  -F "payment_source_id=1" \
  -F "payment_source_type=SMBC"
```
