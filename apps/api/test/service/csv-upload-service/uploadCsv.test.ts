import { CategoryRuleRepository } from "../../../src/repository/mysql/category-rule-repository"
import {
  CreateCsvUploadInput,
  CsvUploadRepository,
} from "../../../src/repository/mysql/csv-upload-repository"
import {
  CreateTransactionInput,
  TransactionRepository,
} from "../../../src/repository/mysql/transaction-repository"
import { UserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { uploadCsv } from "../../../src/service/csv-upload-service"
import { CategoryRule } from "../../../src/types/domain/category-rule"
import { CsvUpload } from "../../../src/types/domain/csv-upload"
import { Transaction } from "../../../src/types/domain/transaction"
import { UserCategoryRule } from "../../../src/types/domain/user-category-rule"

// csv-parserをモック
jest.mock("../../../src/service/csv-parser", () => ({
  getCsvParser: jest.fn().mockReturnValue(
    jest.fn().mockReturnValue([
      {
        amount: 1000,
        description: "スタバで購入",
        transactionDate: new Date("2026-04-01"),
      },
      {
        amount: 2000,
        description: "スイカ利用",
        transactionDate: new Date("2026-04-02"),
      },
    ])
  ),
}))

// モック
const mockExistsByHash = jest.fn<Promise<boolean>, [string]>()
const mockExistsByFileName = jest.fn<Promise<boolean>, [number, string]>()
const mockCsvUploadCreate = jest.fn<Promise<CsvUpload>, [CreateCsvUploadInput]>()
const mockFindByUserId = jest.fn<Promise<CsvUpload[]>, [number]>()
const mockTransactionCreateMany = jest.fn<Promise<Transaction[]>, [CreateTransactionInput[]]>()
const mockFindAll = jest.fn<Promise<CategoryRule[]>, []>()
const mockUserFindByUserId = jest.fn<Promise<UserCategoryRule[]>, [number]>()

const mockCsvUploadRepository: CsvUploadRepository = {
  count: jest.fn(),
  create: mockCsvUploadCreate,
  deleteByIdWithTransactions: jest.fn(),
  existsByFileName: mockExistsByFileName,
  existsByHash: mockExistsByHash,
  findByIdAndUser: jest.fn(),
  findByUserId: mockFindByUserId,
}

const mockTransactionRepository: TransactionRepository = {
  create: jest.fn(),
  createMany: mockTransactionCreateMany,
  deleteById: jest.fn(),
  findByFilter: jest.fn(),
  findByUserIdAndCategoryId: jest.fn(),
  findUncategorizedByUserId: jest.fn(),
  update: jest.fn(),
  updateCategoryByIds: jest.fn(),
}

const mockCategoryRuleRepository: CategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: mockFindAll,
  update: jest.fn(),
}

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findById: jest.fn(),
  findByUserId: mockUserFindByUserId,
  update: jest.fn(),
  upsertByKeyword: jest.fn(),
}

const mockCsvUpload: CsvUpload = {
  id: 1,
  fileHash: "abc123hash",
  fileName: "test.csv",
  paymentSourceId: 1,
  paymentSourceName: "テストカード",
  rowCount: 2,
  uploadedAt: new Date(),
  userId: 1,
}

/**
 * テスト用のデフォルト入力データを生成する
 */
const buildInput = (overrides?: Partial<Parameters<typeof uploadCsv>[0]>) => ({
  fileBuffer: Buffer.from("csvdata"),
  fileName: "test.csv",
  paymentSourceId: 1,
  paymentSourceType: "SMBC" as const,
  userId: 1,
  ...overrides,
})

/**
 * uploadCsv をデフォルトのリポジトリで呼び出すヘルパー
 */
const callUploadCsv = async (data: Parameters<typeof uploadCsv>[0]) =>
  uploadCsv(
    data,
    mockTransactionRepository,
    mockCsvUploadRepository,
    mockCategoryRuleRepository,
    mockUserCategoryRuleRepository
  )

describe("uploadCsv", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    /**
     * デフォルトでは重複なしに設定
     */
    mockExistsByFileName.mockResolvedValue(false)
    mockExistsByHash.mockResolvedValue(false)
    mockUserFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])
    mockCsvUploadCreate.mockResolvedValue(mockCsvUpload)
    mockTransactionCreateMany.mockResolvedValue([])
  })

  it("正常アップロード時に ok: true と csvUpload/importedCount を返す", async () => {
    const result = await callUploadCsv(buildInput())

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.csvUpload).toEqual(mockCsvUpload)
      expect(result.value.importedCount).toBe(2)
    }
    expect(mockCsvUploadCreate).toHaveBeenCalledTimes(1)
    expect(mockTransactionCreateMany).toHaveBeenCalledTimes(1)
  })

  it("同一ユーザーで同名ファイルが既に存在する場合は 409 の業務エラーを返す", async () => {
    // Arrange
    mockExistsByFileName.mockResolvedValue(true)

    // Act
    const result = await callUploadCsv(buildInput({ fileName: "duplicate.csv" }))

    // Assert: 具体的な文言ではなく、エラーの存在と statusCode のみを検証
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.statusCode).toBe(409)
      expect(result.error.type).toBe("CONFLICT")
    }
    expect(mockExistsByFileName).toHaveBeenCalledWith(1, "duplicate.csv")
    /**
     * ファイル名チェックで弾かれるので後続処理は呼ばれない
     */
    expect(mockExistsByHash).not.toHaveBeenCalled()
    expect(mockCsvUploadCreate).not.toHaveBeenCalled()
    expect(mockTransactionCreateMany).not.toHaveBeenCalled()
  })

  it("重複ハッシュの場合は 409 の業務エラーを返す", async () => {
    // Arrange
    mockExistsByHash.mockResolvedValue(true)

    // Act
    const result = await callUploadCsv(buildInput())

    // Assert: メッセージ本文は検証しない
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.statusCode).toBe(409)
      expect(result.error.type).toBe("CONFLICT")
    }
    expect(mockCsvUploadCreate).not.toHaveBeenCalled()
    expect(mockTransactionCreateMany).not.toHaveBeenCalled()
  })

  it("正常アップロード時に csvUploadCreate に正しい引数が渡される", async () => {
    await callUploadCsv(
      buildInput({
        fileName: "upload.csv",
        paymentSourceId: 2,
        userId: 5,
      })
    )

    expect(mockCsvUploadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "upload.csv",
        paymentSourceId: 2,
        userId: 5,
      })
    )
  })

  it("DB 障害のような予期しないエラーは例外としてスローされる", async () => {
    // Arrange
    mockExistsByHash.mockRejectedValue(new Error("Database connection failed"))

    // Act & Assert: 業務エラーではなく throw されることを確認（メッセージは検証しない）
    await expect(callUploadCsv(buildInput())).rejects.toThrow()
  })
})
