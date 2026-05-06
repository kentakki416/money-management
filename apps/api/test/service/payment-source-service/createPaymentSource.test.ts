import {
  CreatePaymentSourceInput,
  PaymentSourceRepository,
} from "../../../src/repository/mysql/payment-source-repository"
import { createPaymentSource } from "../../../src/service/payment-source-service"
import { PaymentSource } from "../../../src/types/domain/payment-source"

const mockCreate = jest.fn<Promise<PaymentSource>, [CreatePaymentSourceInput]>()

const mockPaymentSourceRepository: PaymentSourceRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findByUserId: jest.fn(),
}

const mockPaymentSource: PaymentSource = {
  color: "#6B7280",
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
    mockCreate.mockResolvedValue(mockPaymentSource)
    const input: CreatePaymentSourceInput = { name: "テストカード", type: "SMBC", userId: 1 }

    const result = await createPaymentSource(input, { paymentSourceRepository: mockPaymentSourceRepository })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(mockPaymentSource)
    expect(mockCreate).toHaveBeenCalledWith(input)
  })

  it("正しい入力でリポジトリが呼ばれる", async () => {
    const input: CreatePaymentSourceInput = { name: "MUFGカード", type: "MUFG", userId: 2 }
    mockCreate.mockResolvedValue({ ...mockPaymentSource, ...input, id: 2 })

    await createPaymentSource(input, { paymentSourceRepository: mockPaymentSourceRepository })

    expect(mockCreate).toHaveBeenCalledWith(input)
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockCreate.mockRejectedValue(new Error("Database connection failed"))
    const input: CreatePaymentSourceInput = { name: "テストカード", type: "SMBC", userId: 1 }

    await expect(createPaymentSource(input, { paymentSourceRepository: mockPaymentSourceRepository })).rejects.toThrow()
  })
})
