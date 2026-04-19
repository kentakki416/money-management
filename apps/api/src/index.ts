import cors from "cors"
import express from "express"

import { GoogleOAuthClient } from "./client/google-oauth"
import { redis } from "./client/redis"
import { AdminCategoryCreateController } from "./controller/admin/category-create"
import { AdminCategoryDeleteController } from "./controller/admin/category-delete"
import { AdminCategoryListController } from "./controller/admin/category-list"
import { AdminCategoryRuleCreateController } from "./controller/admin/category-rule-create"
import { AdminCategoryRuleDeleteController } from "./controller/admin/category-rule-delete"
import { AdminCategoryRuleListController } from "./controller/admin/category-rule-list"
import { AdminCategoryRuleUpdateController } from "./controller/admin/category-rule-update"
import { AdminCategoryUpdateController } from "./controller/admin/category-update"
import { AdminStatsController } from "./controller/admin/stats"
import { AdminUserDetailController } from "./controller/admin/user-detail"
import { AdminUserListController } from "./controller/admin/user-list"
import { AuthGoogleController } from "./controller/auth/google"
import { AuthGoogleCallbackController } from "./controller/auth/google-callback"
import { AuthMeController } from "./controller/auth/me"
import { CategoryCreateController } from "./controller/category/create"
import { CategoryDeleteController } from "./controller/category/delete"
import { CategoryListController } from "./controller/category/list"
import { CategoryUpdateController } from "./controller/category/update"
import { CategoryRuleCreateController } from "./controller/category-rule/create"
import { CategoryRuleDeleteController } from "./controller/category-rule/delete"
import { CategoryRuleListController } from "./controller/category-rule/list"
import { CategoryRuleUpdateController } from "./controller/category-rule/update"
import { CsvUploadDeleteController } from "./controller/csv-upload/delete"
import { CsvUploadListController } from "./controller/csv-upload/list"
import { CsvUploadController } from "./controller/csv-upload/upload"
import { HealthLivenessController } from "./controller/health/liveness"
import { HealthReadinessController } from "./controller/health/readiness"
import { MemoCreateController } from "./controller/memo/create"
import { MemoDeleteController } from "./controller/memo/delete"
import { MemoDetailController } from "./controller/memo/detail"
import { MemoListController } from "./controller/memo/list"
import { MemoUpdateController } from "./controller/memo/update"
import { PaymentSourceCreateController } from "./controller/payment-source/create"
import { PaymentSourceDeleteController } from "./controller/payment-source/delete"
import { PaymentSourceListController } from "./controller/payment-source/list"
import { SummaryCalendarController } from "./controller/summary/calendar"
import { SummaryMonthlyController } from "./controller/summary/monthly"
import { SummaryTrendController } from "./controller/summary/trend"
import { TransactionCreateController } from "./controller/transaction/create"
import { TransactionDeleteController } from "./controller/transaction/delete"
import { TransactionListController } from "./controller/transaction/list"
import { TransactionUpdateController } from "./controller/transaction/update"
import { UserCategoryRuleCreateController } from "./controller/user-category-rule/create"
import { UserCategoryRuleDeleteController } from "./controller/user-category-rule/delete"
import { UserCategoryRuleListController } from "./controller/user-category-rule/list"
import { UserCategoryRuleUpdateController } from "./controller/user-category-rule/update"
import { logger } from "./log"
import { authMiddleware } from "./middleware/auth"
import { errorHandler } from "./middleware/error-handler"
import { requestLogger } from "./middleware/request-logger"
import { prisma } from "./prisma/prisma.client"
import {
  PrismaAuthAccountRepository,
  PrismaCategoryRepository,
  PrismaCategoryRuleRepository,
  PrismaCsvUploadRepository,
  PrismaDatabaseHealthRepository,
  PrismaMemoRepository,
  PrismaPaymentSourceRepository,
  PrismaSummaryRepository,
  PrismaTransactionRepository,
  PrismaUserCategoryRuleRepository,
  PrismaUserRepository,
  PrismaUserRegistrationRepository,
  PrismaUserSummaryRepository,
} from "./repository/mysql"
import { IoRedisHealthRepository } from "./repository/redis"
import { adminRouter } from "./routes/admin-router"
import { authRouter } from "./routes/auth-router"
import { categoryRouter } from "./routes/category-router"
import { csvUploadRouter } from "./routes/csv-upload-router"
import { healthRouter } from "./routes/health-router"
import { memoRouter } from "./routes/memo-router"
import { paymentSourceRouter } from "./routes/payment-source-router"
import { summaryRouter } from "./routes/summary-router"
import { transactionRouter } from "./routes/transaction-router"
import { userCategoryRuleRouter } from "./routes/user-category-rule-router"

const app = express()
const PORT = process.env.PORT || 8080
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"
const ADMIN_URL = process.env.ADMIN_URL || "http://localhost:3030"

// 環境変数（未設定の場合はダミー値で起動する。認証機能は動作しないがヘルスチェック等は応答可能）
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "dummy"
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "dummy"
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/api/auth/google/callback"

// Repository のインスタンス化
const authAccountRepository = new PrismaAuthAccountRepository(prisma)
const categoryRepository = new PrismaCategoryRepository(prisma)
const categoryRuleRepository = new PrismaCategoryRuleRepository(prisma)
const csvUploadRepository = new PrismaCsvUploadRepository(prisma)
const databaseHealthRepository = new PrismaDatabaseHealthRepository(prisma)
const memoRepository = new PrismaMemoRepository(prisma)
const paymentSourceRepository = new PrismaPaymentSourceRepository(prisma)
const summaryRepository = new PrismaSummaryRepository(prisma)
const transactionRepository = new PrismaTransactionRepository(prisma)
const userCategoryRuleRepository = new PrismaUserCategoryRuleRepository(prisma)
const userRepository = new PrismaUserRepository(prisma)
const userRegistrationRepository = new PrismaUserRegistrationRepository(prisma)
const userSummaryRepository = new PrismaUserSummaryRepository(prisma)
const redisHealthRepository = new IoRedisHealthRepository(redis)

// Client のインスタンス化
const googleOAuthClient = new GoogleOAuthClient(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
)

// Admin Controller のインスタンス化
const adminStatsController = new AdminStatsController(userRepository, csvUploadRepository)
const adminUserListController = new AdminUserListController(userSummaryRepository)
const adminUserDetailController = new AdminUserDetailController(userSummaryRepository)
const adminCategoryListController = new AdminCategoryListController(categoryRepository)
const adminCategoryCreateController = new AdminCategoryCreateController(categoryRepository)
const adminCategoryUpdateController = new AdminCategoryUpdateController(categoryRepository)
const adminCategoryDeleteController = new AdminCategoryDeleteController(categoryRepository)
const adminCategoryRuleListController = new AdminCategoryRuleListController(categoryRuleRepository)
const adminCategoryRuleCreateController = new AdminCategoryRuleCreateController(categoryRuleRepository)
const adminCategoryRuleUpdateController = new AdminCategoryRuleUpdateController(categoryRuleRepository)
const adminCategoryRuleDeleteController = new AdminCategoryRuleDeleteController(categoryRuleRepository)

// Health Controller のインスタンス化
const healthLivenessController = new HealthLivenessController()
const healthReadinessController = new HealthReadinessController(databaseHealthRepository, redisHealthRepository)

// Auth Controller のインスタンス化
const authGoogleController = new AuthGoogleController(googleOAuthClient)
const authGoogleCallbackController = new AuthGoogleCallbackController(
  authAccountRepository,
  userRegistrationRepository,
  googleOAuthClient,
)
const authMeController = new AuthMeController(userRepository)

// Category Controller のインスタンス化
const categoryListController = new CategoryListController(categoryRepository)
const categoryCreateController = new CategoryCreateController(categoryRepository)
const categoryUpdateController = new CategoryUpdateController(categoryRepository)
const categoryDeleteController = new CategoryDeleteController(categoryRepository)

// CategoryRule Controller のインスタンス化
const categoryRuleListController = new CategoryRuleListController(categoryRuleRepository)
const categoryRuleCreateController = new CategoryRuleCreateController(categoryRuleRepository)
const categoryRuleUpdateController = new CategoryRuleUpdateController(categoryRuleRepository)
const categoryRuleDeleteController = new CategoryRuleDeleteController(categoryRuleRepository)

// CsvUpload Controller のインスタンス化
const csvUploadController = new CsvUploadController(
  transactionRepository,
  csvUploadRepository,
  paymentSourceRepository,
  categoryRuleRepository,
  userCategoryRuleRepository,
)
const csvUploadListController = new CsvUploadListController(csvUploadRepository)
const csvUploadDeleteController = new CsvUploadDeleteController(csvUploadRepository)

// Memo Controller のインスタンス化
const memoListController = new MemoListController(memoRepository)
const memoDetailController = new MemoDetailController(memoRepository)
const memoCreateController = new MemoCreateController(memoRepository)
const memoUpdateController = new MemoUpdateController(memoRepository)
const memoDeleteController = new MemoDeleteController(memoRepository)

// PaymentSource Controller のインスタンス化
const paymentSourceListController = new PaymentSourceListController(paymentSourceRepository)
const paymentSourceCreateController = new PaymentSourceCreateController(paymentSourceRepository)
const paymentSourceDeleteController = new PaymentSourceDeleteController(paymentSourceRepository)

// Summary Controller のインスタンス化
const summaryMonthlyController = new SummaryMonthlyController(summaryRepository)
const summaryCalendarController = new SummaryCalendarController(summaryRepository)
const summaryTrendController = new SummaryTrendController(summaryRepository)

// Transaction Controller のインスタンス化
const transactionListController = new TransactionListController(transactionRepository)
const transactionCreateController = new TransactionCreateController(
  transactionRepository,
  categoryRuleRepository,
  userCategoryRuleRepository,
)
const transactionUpdateController = new TransactionUpdateController(
  transactionRepository,
  userCategoryRuleRepository,
)
const transactionDeleteController = new TransactionDeleteController(transactionRepository)

// UserCategoryRule Controller のインスタンス化
const userCategoryRuleListController = new UserCategoryRuleListController(userCategoryRuleRepository)
const userCategoryRuleCreateController = new UserCategoryRuleCreateController(
  userCategoryRuleRepository,
  transactionRepository,
  categoryRuleRepository,
)
const userCategoryRuleUpdateController = new UserCategoryRuleUpdateController(userCategoryRuleRepository)
const userCategoryRuleDeleteController = new UserCategoryRuleDeleteController(
  userCategoryRuleRepository,
  transactionRepository,
  categoryRuleRepository,
)

// cors設定のミドルウェア
app.use(
  cors({
    credentials: true,
    origin: [FRONTEND_URL, ADMIN_URL],
  })
)

// jsonを変換するミドルウェア
app.use(express.json())

// 認証ミドルウェア
app.use(authMiddleware)

// リクエストのロギングミドルウェア
app.use(requestLogger)

// ルーティング
app.use(
  "/api/admin",
  adminRouter({
    categoryCreate: adminCategoryCreateController,
    categoryDelete: adminCategoryDeleteController,
    categoryList: adminCategoryListController,
    categoryRuleCreate: adminCategoryRuleCreateController,
    categoryRuleDelete: adminCategoryRuleDeleteController,
    categoryRuleList: adminCategoryRuleListController,
    categoryRuleUpdate: adminCategoryRuleUpdateController,
    categoryUpdate: adminCategoryUpdateController,
    stats: adminStatsController,
    userDetail: adminUserDetailController,
    userList: adminUserListController,
  })
)
app.use(
  "/api/health",
  healthRouter({
    liveness: healthLivenessController,
    readiness: healthReadinessController,
  })
)
app.use(
  "/api/auth",
  authRouter({
    callback: authGoogleCallbackController,
    google: authGoogleController,
    me: authMeController,
  })
)
app.use(
  "/api/categories",
  categoryRouter({
    create: categoryCreateController,
    delete: categoryDeleteController,
    list: categoryListController,
    update: categoryUpdateController,
  })
)
app.use(
  "/api/csv-uploads",
  csvUploadRouter({
    delete: csvUploadDeleteController,
    list: csvUploadListController,
    upload: csvUploadController,
  })
)
app.use(
  "/api/memo",
  memoRouter({
    create: memoCreateController,
    delete: memoDeleteController,
    detail: memoDetailController,
    list: memoListController,
    update: memoUpdateController,
  })
)
app.use(
  "/api/payment-sources",
  paymentSourceRouter({
    create: paymentSourceCreateController,
    delete: paymentSourceDeleteController,
    list: paymentSourceListController,
  })
)
app.use(
  "/api/summary",
  summaryRouter({
    calendar: summaryCalendarController,
    monthly: summaryMonthlyController,
    trend: summaryTrendController,
  })
)
app.use(
  "/api/transactions",
  transactionRouter({
    create: transactionCreateController,
    delete: transactionDeleteController,
    list: transactionListController,
    update: transactionUpdateController,
  })
)
app.use(
  "/api/user-category-rules",
  userCategoryRuleRouter({
    create: userCategoryRuleCreateController,
    delete: userCategoryRuleDeleteController,
    list: userCategoryRuleListController,
    update: userCategoryRuleUpdateController,
  })
)

/**
 * グローバルエラーハンドラ（必ず全ルート登録後に設定する）
 * Controller でキャッチされなかった例外・ライブラリが throw した例外を 500 で返す
 */
app.use(errorHandler)

// サーバー起動
app.listen(PORT, () => {
  logger.info("API server running", {
    environment: process.env.NODE_ENV || "development",
    port: PORT,
    url: `http://localhost:${PORT}`,
  })
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server")
  await Promise.all([
    prisma.$disconnect(),
    redis.quit(),
  ])
  logger.info("Database and Redis connections closed")
  process.exit(0)
})

// 予期しない例外をキャッチ（念のため）
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection",  reason as Error )
  process.exit(1)
})