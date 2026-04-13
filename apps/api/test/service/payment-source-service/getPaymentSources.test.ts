import { PaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { getPaymentSources } from "../../../src/service/payment-source-service"
import { PaymentSource } from "../../../src/types/domain/payment-source"

// モック
const mockFindByUserId = jest.fn<Promise<PaymentSource[]>, [number]>()

const mockPaymentSourceRepository: PaymentSourceRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findByUserId: mockFindByUserId,
}

const mockPaymentSource: PaymentSource = {
  id: 1,
  name: "テストカード",
  type: "SMBC",
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("getPaymentSources", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("支払い元一覧を返す", async () => {
    // Arrange
    const mockPaymentSources: PaymentSource[] = [
      { ...mockPaymentSource, id: 1, name: "SMBCカード" },
      { ...mockPaymentSource, id: 2, name: "MUFGカード", type: "MUFG" },
    ]
    mockFindByUserId.mockResolvedValue(mockPaymentSources)

    // Act
    const result = await getPaymentSources(1, mockPaymentSourceRepository)

    // Assert
    expect(result).toEqual(mockPaymentSources)
    expect(result).toHaveLength(2)
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockFindByUserId).toHaveBeenCalledTimes(1)
  })

  it("支払い元が存在しない場合、空配列を返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])

    // Act
    const result = await getPaymentSources(1, mockPaymentSourceRepository)

    // Assert
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it("指定したuserIdでリポジトリが呼ばれる", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])

    // Act
    await getPaymentSources(99, mockPaymentSourceRepository)

    // Assert
    expect(mockFindByUserId).toHaveBeenCalledWith(99)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindByUserId.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getPaymentSources(1, mockPaymentSourceRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
