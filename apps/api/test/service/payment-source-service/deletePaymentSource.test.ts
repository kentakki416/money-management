import { PaymentSourceRepository } from "../../../src/repository/mysql/payment-source-repository"
import { deletePaymentSource } from "../../../src/service/payment-source-service"

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

  it("支払い元を削除して ok: true を返す", async () => {
    mockDeleteById.mockResolvedValue(undefined)

    const result = await deletePaymentSource(1, { paymentSourceRepository: mockPaymentSourceRepository })

    expect(result.ok).toBe(true)
    expect(mockDeleteById).toHaveBeenCalledWith(1)
  })

  it("指定したIDで削除が呼ばれる", async () => {
    mockDeleteById.mockResolvedValue(undefined)
    await deletePaymentSource(99, { paymentSourceRepository: mockPaymentSourceRepository })
    expect(mockDeleteById).toHaveBeenCalledWith(99)
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockDeleteById.mockRejectedValue(new Error("Database connection failed"))
    await expect(deletePaymentSource(1, { paymentSourceRepository: mockPaymentSourceRepository })).rejects.toThrow()
  })
})
