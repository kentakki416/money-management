import { TransactionRepository } from "../../../src/repository/mysql/transaction-repository"
import { deleteTransaction } from "../../../src/service/transaction-service"

// モック
const mockDeleteById = jest.fn<Promise<void>, [number]>()

const mockTransactionRepository: TransactionRepository = {
  create: jest.fn(),
  createMany: jest.fn(),
  deleteById: mockDeleteById,
  findByFilter: jest.fn(),
  update: jest.fn(),
}

describe("deleteTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("取引を削除してtrueを返す", async () => {
    // Arrange
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    const result = await deleteTransaction(1, mockTransactionRepository)

    // Assert
    expect(result).toBe(true)
    expect(mockDeleteById).toHaveBeenCalledWith(1)
    expect(mockDeleteById).toHaveBeenCalledTimes(1)
  })

  it("指定したIDで削除が呼ばれる", async () => {
    // Arrange
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    await deleteTransaction(42, mockTransactionRepository)

    // Assert
    expect(mockDeleteById).toHaveBeenCalledWith(42)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockDeleteById.mockRejectedValue(mockError)

    // Act & Assert
    await expect(deleteTransaction(1, mockTransactionRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
