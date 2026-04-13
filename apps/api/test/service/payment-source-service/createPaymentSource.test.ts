import {
  CreatePaymentSourceInput,
  PaymentSourceRepository,
} from "../../../src/repository/mysql/payment-source-repository"
import { createPaymentSource } from "../../../src/service/payment-source-service"
import { PaymentSource } from "../../../src/types/domain/payment-source"

// モック
const mockCreate = jest.fn<Promise<PaymentSource>, [CreatePaymentSourceInput]>()

const mockPaymentSourceRepository: PaymentSourceRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findByUserId: jest.fn(),
}

const mockPaymentSource: PaymentSource = {
  id: 1,
  name: "テストカード",
  type: "SMBC",
  userId: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("createPaymentSource", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("支払い元を作成して返す", async () => {
    // Arrange
    mockCreate.mockResolvedValue(mockPaymentSource)

    const input: CreatePaymentSourceInput = {
      name: "テストカード",
      type: "SMBC",
      userId: 1,
    }

    // Act
    const result = await createPaymentSource(input, mockPaymentSourceRepository)

    // Assert
    expect(result).toEqual(mockPaymentSource)
    expect(mockCreate).toHaveBeenCalledWith(input)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it("正しい入力でリポジトリが呼ばれる", async () => {
    // Arrange
    const input: CreatePaymentSourceInput = {
      name: "MUFGカード",
      type: "MUFG",
      userId: 2,
    }
    mockCreate.mockResolvedValue({ ...mockPaymentSource, ...input, id: 2 })

    // Act
    await createPaymentSource(input, mockPaymentSourceRepository)

    // Assert
    expect(mockCreate).toHaveBeenCalledWith({
      name: "MUFGカード",
      type: "MUFG",
      userId: 2,
    })
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockCreate.mockRejectedValue(mockError)

    const input: CreatePaymentSourceInput = {
      name: "テストカード",
      type: "SMBC",
      userId: 1,
    }

    // Act & Assert
    await expect(createPaymentSource(input, mockPaymentSourceRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
