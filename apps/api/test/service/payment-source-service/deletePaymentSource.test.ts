import { PaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { deletePaymentSource } from "../../../src/service/payment-source-service"

// モック
const mockDeleteById = jest.fn<Promise<void>, [number]>()

const mockPaymentSourceRepository: PaymentSourceRepository = {
  create: jest.fn(),
  deleteById: mockDeleteById,
  findByUserId: jest.fn(),
}

describe("deletePaymentSource", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("支払い元を削除してtrueを返す", async () => {
    // Arrange
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    const result = await deletePaymentSource(1, mockPaymentSourceRepository)

    // Assert
    expect(result).toBe(true)
    expect(mockDeleteById).toHaveBeenCalledWith(1)
    expect(mockDeleteById).toHaveBeenCalledTimes(1)
  })

  it("指定したIDで削除が呼ばれる", async () => {
    // Arrange
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    await deletePaymentSource(99, mockPaymentSourceRepository)

    // Assert
    expect(mockDeleteById).toHaveBeenCalledWith(99)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockDeleteById.mockRejectedValue(mockError)

    // Act & Assert
    await expect(deletePaymentSource(1, mockPaymentSourceRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
