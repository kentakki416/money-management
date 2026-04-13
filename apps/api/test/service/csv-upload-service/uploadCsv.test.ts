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
const mockCsvUploadCreate = jest.fn<Promise<CsvUpload>, [CreateCsvUploadInput]>()
const mockFindByUserId = jest.fn<Promise<CsvUpload[]>, [number]>()
const mockTransactionCreateMany = jest.fn<Promise<Transaction[]>, [CreateTransactionInput[]]>()
const mockFindAll = jest.fn<Promise<CategoryRule[]>, []>()
const mockUserFindByUserId = jest.fn<Promise<UserCategoryRule[]>, [number]>()

const mockCsvUploadRepository: CsvUploadRepository = {
  create: mockCsvUploadCreate,
  existsByHash: mockExistsByHash,
  findByUserId: mockFindByUserId,
}

const mockTransactionRepository: TransactionRepository = {
  create: jest.fn(),
  createMany: mockTransactionCreateMany,
  deleteById: jest.fn(),
  findByFilter: jest.fn(),
  update: jest.fn(),
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

describe("uploadCsv", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("正常アップロード時に取引が登録されcsvUploadとimportedCountを返す", async () => {
    // Arrange
    mockExistsByHash.mockResolvedValue(false)
    mockUserFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])
    mockCsvUploadCreate.mockResolvedValue(mockCsvUpload)
    mockTransactionCreateMany.mockResolvedValue([])

    const fileBuffer = Buffer.from("2026/04/01,スタバで購入,1000\n2026/04/02,スイカ利用,2000")
    const data = {
      fileBuffer,
      fileName: "test.csv",
      paymentSourceId: 1,
      paymentSourceType: "SMBC" as const,
      userId: 1,
    }

    // Act
    const result = await uploadCsv(
      data,
      mockTransactionRepository,
      mockCsvUploadRepository,
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result.csvUpload).toEqual(mockCsvUpload)
    expect(result.importedCount).toBe(2)
    expect(mockExistsByHash).toHaveBeenCalledTimes(1)
    expect(mockCsvUploadCreate).toHaveBeenCalledTimes(1)
    expect(mockTransactionCreateMany).toHaveBeenCalledTimes(1)
  })

  it("重複ハッシュの場合はエラーをスローする", async () => {
    // Arrange
    mockExistsByHash.mockResolvedValue(true)

    const fileBuffer = Buffer.from("2026/04/01,スタバで購入,1000")
    const data = {
      fileBuffer,
      fileName: "test.csv",
      paymentSourceId: 1,
      paymentSourceType: "SMBC" as const,
      userId: 1,
    }

    // Act & Assert
    await expect(
      uploadCsv(
        data,
        mockTransactionRepository,
        mockCsvUploadRepository,
        mockCategoryRuleRepository,
        mockUserCategoryRuleRepository
      )
    ).rejects.toThrow("このCSVファイルはすでにアップロード済みです")

    expect(mockCsvUploadCreate).not.toHaveBeenCalled()
    expect(mockTransactionCreateMany).not.toHaveBeenCalled()
  })

  it("正常アップロード時にcsvUploadCreateに正しい引数が渡される", async () => {
    // Arrange
    mockExistsByHash.mockResolvedValue(false)
    mockUserFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])
    mockCsvUploadCreate.mockResolvedValue(mockCsvUpload)
    mockTransactionCreateMany.mockResolvedValue([])

    const fileBuffer = Buffer.from("csvdata")
    const data = {
      fileBuffer,
      fileName: "upload.csv",
      paymentSourceId: 2,
      paymentSourceType: "SMBC" as const,
      userId: 5,
    }

    // Act
    await uploadCsv(
      data,
      mockTransactionRepository,
      mockCsvUploadRepository,
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockCsvUploadCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "upload.csv",
        paymentSourceId: 2,
        userId: 5,
      })
    )
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    mockExistsByHash.mockRejectedValue(new Error("Database connection failed"))

    const fileBuffer = Buffer.from("csvdata")
    const data = {
      fileBuffer,
      fileName: "test.csv",
      paymentSourceId: 1,
      paymentSourceType: "SMBC" as const,
      userId: 1,
    }

    // Act & Assert
    await expect(
      uploadCsv(
        data,
        mockTransactionRepository,
        mockCsvUploadRepository,
        mockCategoryRuleRepository,
        mockUserCategoryRuleRepository
      )
    ).rejects.toThrow("Database connection failed")
  })
})
