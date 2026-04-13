import {
  TransactionRepository,
  UpdateTransactionInput,
} from "../../../src/repository/mysql/transaction-repository"
import { UserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { updateTransaction } from "../../../src/service/transaction-service"
import { Transaction } from "../../../src/types/domain/transaction"
import { UserCategoryRule } from "../../../src/types/domain/user-category-rule"

// モック
const mockUpdate = jest.fn<Promise<Transaction>, [number, UpdateTransactionInput]>()
const mockUpsertByKeyword = jest.fn<Promise<UserCategoryRule>, [number, string, number]>()

const mockTransactionRepository: TransactionRepository = {
  create: jest.fn(),
  createMany: jest.fn(),
  deleteById: jest.fn(),
  findByFilter: jest.fn(),
  update: mockUpdate,
}

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  upsertByKeyword: mockUpsertByKeyword,
}

const mockTransaction: Transaction = {
  id: 1,
  amount: 1000,
  categoryColor: "#FF6384",
  categoryId: 2,
  categoryName: "交通",
  csvUploadId: null,
  description: "Suica利用",
  isManual: true,
  paymentSourceId: 1,
  paymentSourceName: "テストカード",
  transactionDate: new Date("2026-04-01"),
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockUserCategoryRule: UserCategoryRule = {
  id: 1,
  userId: 1,
  categoryId: 2,
  categoryName: "交通",
  keyword: "Suica利用",
  matchType: "PARTIAL",
  priority: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("updateTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("取引を更新して返す", async () => {
    // Arrange
    mockUpdate.mockResolvedValue(mockTransaction)
    mockUpsertByKeyword.mockResolvedValue(mockUserCategoryRule)

    const data: UpdateTransactionInput = {
      amount: 1000,
      categoryId: 2,
    }

    // Act
    const result = await updateTransaction(
      1,
      data,
      1,
      "Suica利用",
      1,
      mockTransactionRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual(mockTransaction)
    expect(mockUpdate).toHaveBeenCalledWith(1, data)
  })

  it("カテゴリが変更された場合はupsertByKeywordが呼ばれる", async () => {
    // Arrange
    mockUpdate.mockResolvedValue(mockTransaction)
    mockUpsertByKeyword.mockResolvedValue(mockUserCategoryRule)

    const data: UpdateTransactionInput = {
      categoryId: 2,
    }
    const previousCategoryId = 1

    // Act
    await updateTransaction(
      1,
      data,
      previousCategoryId,
      "Suica利用",
      1,
      mockTransactionRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockUpsertByKeyword).toHaveBeenCalledWith(1, "Suica利用", 2)
    expect(mockUpsertByKeyword).toHaveBeenCalledTimes(1)
  })

  it("カテゴリが変更されない場合はupsertByKeywordが呼ばれない", async () => {
    // Arrange
    mockUpdate.mockResolvedValue(mockTransaction)

    const data: UpdateTransactionInput = {
      categoryId: 1,
    }
    const previousCategoryId = 1

    // Act
    await updateTransaction(
      1,
      data,
      previousCategoryId,
      "Suica利用",
      1,
      mockTransactionRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockUpsertByKeyword).not.toHaveBeenCalled()
  })

  it("categoryIdがundefinedの場合はupsertByKeywordが呼ばれない", async () => {
    // Arrange
    mockUpdate.mockResolvedValue(mockTransaction)

    const data: UpdateTransactionInput = {
      amount: 2000,
    }

    // Act
    await updateTransaction(
      1,
      data,
      1,
      "Suica利用",
      1,
      mockTransactionRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockUpsertByKeyword).not.toHaveBeenCalled()
  })

  it("categoryIdがnullの場合はupsertByKeywordが呼ばれない", async () => {
    // Arrange
    mockUpdate.mockResolvedValue(mockTransaction)

    const data: UpdateTransactionInput = {
      categoryId: null,
    }

    // Act
    await updateTransaction(
      1,
      data,
      1,
      "Suica利用",
      1,
      mockTransactionRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(mockUpsertByKeyword).not.toHaveBeenCalled()
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockUpdate.mockRejectedValue(mockError)

    // Act & Assert
    await expect(
      updateTransaction(
        1,
        { amount: 1000 },
        1,
        "Suica利用",
        1,
        mockTransactionRepository,
        mockUserCategoryRuleRepository
      )
    ).rejects.toThrow("Database connection failed")
  })
})
