import {
  TransactionFilter,
  TransactionRepository,
} from "../../../src/repository/mysql/transaction-repository"
import { getAllTransactions } from "../../../src/service/transaction-service"
import { Transaction } from "../../../src/types/domain/transaction"

// モック
const mockFindByFilter = jest.fn<Promise<Transaction[]>, [TransactionFilter]>()

const mockTransactionRepository: TransactionRepository = {
  create: jest.fn(),
  createMany: jest.fn(),
  deleteById: jest.fn(),
  findByFilter: mockFindByFilter,
  update: jest.fn(),
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

describe("getAllTransactions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("取引一覧と合計金額を返す", async () => {
    // Arrange
    const mockTransactions: Transaction[] = [
      { ...mockTransaction, id: 1, amount: 1000 },
      { ...mockTransaction, id: 2, amount: 2000 },
    ]
    mockFindByFilter.mockResolvedValue(mockTransactions)

    const filter: TransactionFilter = { userId: 1 }

    // Act
    const result = await getAllTransactions(filter, mockTransactionRepository)

    // Assert
    expect(result.transactions).toEqual(mockTransactions)
    expect(result.totalAmount).toBe(3000)
    expect(result.transactions).toHaveLength(2)
    expect(mockFindByFilter).toHaveBeenCalledWith(filter)
    expect(mockFindByFilter).toHaveBeenCalledTimes(1)
  })

  it("フィルタ条件が正しくリポジトリに渡される", async () => {
    // Arrange
    mockFindByFilter.mockResolvedValue([])

    const filter: TransactionFilter = {
      userId: 1,
      year: 2026,
      month: 4,
      categoryId: 1,
    }

    // Act
    await getAllTransactions(filter, mockTransactionRepository)

    // Assert
    expect(mockFindByFilter).toHaveBeenCalledWith(filter)
  })

  it("取引が存在しない場合、空配列と合計金額0を返す", async () => {
    // Arrange
    mockFindByFilter.mockResolvedValue([])

    const filter: TransactionFilter = { userId: 1 }

    // Act
    const result = await getAllTransactions(filter, mockTransactionRepository)

    // Assert
    expect(result.transactions).toEqual([])
    expect(result.totalAmount).toBe(0)
    expect(result.transactions).toHaveLength(0)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindByFilter.mockRejectedValue(mockError)

    // Act & Assert
    await expect(
      getAllTransactions({ userId: 1 }, mockTransactionRepository)
    ).rejects.toThrow("Database connection failed")
  })
})
