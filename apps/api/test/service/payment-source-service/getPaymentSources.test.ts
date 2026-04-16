import { PaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { getPaymentSources } from "../../../src/service/payment-source-service"
import { PaymentSource } from "../../../src/types/domain/payment-source"

const mockFindByUserId = jest.fn<Promise<PaymentSource[]>, [number]>()

const mockPaymentSourceRepository: PaymentSourceRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findByUserId: mockFindByUserId,
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

describe("getPaymentSources", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("支払い元一覧を返す", async () => {
    const mockPaymentSources: PaymentSource[] = [
      { ...mockPaymentSource, id: 1, name: "SMBCカード" },
      { ...mockPaymentSource, id: 2, name: "MUFGカード", type: "MUFG" },
    ]
    mockFindByUserId.mockResolvedValue(mockPaymentSources)

    const result = await getPaymentSources(1, mockPaymentSourceRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockPaymentSources)
      expect(result.value).toHaveLength(2)
    }
  })

  it("支払い元が存在しない場合、空配列を返す", async () => {
    mockFindByUserId.mockResolvedValue([])

    const result = await getPaymentSources(1, mockPaymentSourceRepository)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual([])
  })

  it("指定したuserIdでリポジトリが呼ばれる", async () => {
    mockFindByUserId.mockResolvedValue([])
    await getPaymentSources(99, mockPaymentSourceRepository)
    expect(mockFindByUserId).toHaveBeenCalledWith(99)
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockFindByUserId.mockRejectedValue(new Error("Database connection failed"))
    await expect(getPaymentSources(1, mockPaymentSourceRepository)).rejects.toThrow()
  })
})
