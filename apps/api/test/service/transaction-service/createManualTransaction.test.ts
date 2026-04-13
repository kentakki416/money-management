import { CategoryRuleRepository } from "../../../src/repository/mysql/category-rule-repository"
import {
  CreateTransactionInput,
  TransactionRepository,
} from "../../../src/repository/mysql/transaction-repository"
import { UserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { createManualTransaction } from "../../../src/service/transaction-service"
import { CategoryRule } from "../../../src/types/domain/category-rule"
import { Transaction } from "../../../src/types/domain/transaction"
import { UserCategoryRule } from "../../../src/types/domain/user-category-rule"

// モック
const mockCreate = jest.fn<Promise<Transaction>, [CreateTransactionInput]>()
const mockFindAll = jest.fn<Promise<CategoryRule[]>, []>()
const mockFindByUserId = jest.fn<Promise<UserCategoryRule[]>, [number]>()

const mockTransactionRepository: TransactionRepository = {
  create: mockCreate,
  createMany: jest.fn(),
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
  findByUserId: mockFindByUserId,
  update: jest.fn(),
  upsertByKeyword: jest.fn(),
}

const mockTransaction: Transaction = {
  id: 1,
  amount: 1000,
  categoryColor: "#FF6384",
  categoryId: 1,
  categoryName: "飲食",
  csvUploadId: null,
  description: "スタバで購入",
  isManual: true,
  paymentSourceId: 1,
  paymentSourceName: "テストカード",
  transactionDate: new Date("2026-04-01"),
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("createManualTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリIDが指定された場合、そのまま取引を作成する", async () => {
    // Arrange
    mockCreate.mockResolvedValue(mockTransaction)

    const data = {
      amount: 1000,
      categoryId: 1,
      description: "スタバで購入",
      paymentSourceId: 1,
      transactionDate: new Date("2026-04-01"),
      userId: 1,
    }

    // Act
    const result = await createManualTransaction(
      data,
      mockTransactionRepository,
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual(mockTransaction)
    expect(mockCreate).toHaveBeenCalledWith({
      amount: 1000,
      categoryId: 1,
      description: "スタバで購入",
      isManual: true,
      paymentSourceId: 1,
      transactionDate: new Date("2026-04-01"),
      userId: 1,
    })
    expect(mockFindByUserId).not.toHaveBeenCalled()
    expect(mockFindAll).not.toHaveBeenCalled()
  })

  it("カテゴリIDが未指定の場合、自動分類を行う", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([
      {
        id: 1,
        categoryId: 3,
        categoryName: "食費",
        keyword: "スタバ",
        matchType: "PARTIAL",
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
    mockCreate.mockResolvedValue({ ...mockTransaction, categoryId: 3 })

    const data = {
      amount: 1000,
      description: "スタバで購入",
      paymentSourceId: 1,
      transactionDate: new Date("2026-04-01"),
      userId: 1,
    }

    // Act
    const result = await createManualTransaction(
      data,
      mockTransactionRepository,
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockFindAll).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        categoryId: 3,
        isManual: true,
      })
    )
    expect(result.categoryId).toBe(3)
  })

  it("カテゴリIDがnullの場合も自動分類を行う", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])
    mockCreate.mockResolvedValue({ ...mockTransaction, categoryId: 99 })

    const data = {
      amount: 500,
      categoryId: undefined,
      description: "不明な支出",
      paymentSourceId: 1,
      transactionDate: new Date("2026-04-01"),
      userId: 1,
    }

    // Act
    await createManualTransaction(
      data,
      mockTransactionRepository,
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 99 })
    )
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])
    const mockError = new Error("Database connection failed")
    mockCreate.mockRejectedValue(mockError)

    const data = {
      amount: 1000,
      description: "テスト",
      paymentSourceId: 1,
      transactionDate: new Date("2026-04-01"),
      userId: 1,
    }

    // Act & Assert
    await expect(
      createManualTransaction(
        data,
        mockTransactionRepository,
        mockCategoryRuleRepository,
        mockUserCategoryRuleRepository
      )
    ).rejects.toThrow("Database connection failed")
  })
})
