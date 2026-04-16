import { TransactionRepository } from "../../../src/repository/mysql/transaction-repository"
import { deleteTransaction } from "../../../src/service/transaction-service"

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

  it("取引を削除して ok: true を返す", async () => {
    mockDeleteById.mockResolvedValue(undefined)

    const result = await deleteTransaction(1, mockTransactionRepository)

    expect(result.ok).toBe(true)
    expect(mockDeleteById).toHaveBeenCalledWith(1)
  })

  it("指定したIDで削除が呼ばれる", async () => {
    mockDeleteById.mockResolvedValue(undefined)
    await deleteTransaction(42, mockTransactionRepository)
    expect(mockDeleteById).toHaveBeenCalledWith(42)
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockDeleteById.mockRejectedValue(new Error("Database connection failed"))
    await expect(deleteTransaction(1, mockTransactionRepository)).rejects.toThrow()
  })
})
