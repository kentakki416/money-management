import {
  TransactionFilter,
  TransactionRepository,
} from "../../../src/repository/mysql/transaction-repository"
import { getAllTransactions } from "../../../src/service/transaction-service"
import { Transaction } from "../../../src/types/domain/transaction"

const mockFindByFilter = jest.fn<Promise<Transaction[]>, [TransactionFilter]>()

const mockTransactionRepository: TransactionRepository = {
  create: jest.fn(),
  createMany: jest.fn(),
  deleteById: jest.fn(),
  findByFilter: mockFindByFilter,
  findByUserIdAndCategoryId: jest.fn(),
  findUncategorizedByUserId: jest.fn(),
  update: jest.fn(),
  updateCategoryByIds: jest.fn(),
}

const mockTransaction: Transaction = {
  id: 1,
  amount: 1000,
  categoryColor: "#FF6384",
  categoryId: 1,
  categoryName: "飲食",
  csvUpload: null,
  csvUploadId: null,
  description: "スタバで購入",
  isManual: true,
  paymentSourceColor: "#6B7280",
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
    const mockTransactions: Transaction[] = [
      { ...mockTransaction, id: 1, amount: 1000 },
      { ...mockTransaction, id: 2, amount: 2000 },
    ]
    mockFindByFilter.mockResolvedValue(mockTransactions)

    const filter: TransactionFilter = { userId: 1 }
    const result = await getAllTransactions(filter, mockTransactionRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.transactions).toEqual(mockTransactions)
      expect(result.value.totalAmount).toBe(3000)
    }
  })

  it("フィルタ条件が正しくリポジトリに渡される", async () => {
    mockFindByFilter.mockResolvedValue([])
    const filter: TransactionFilter = { userId: 1, year: 2026, month: 4, categoryId: 1 }

    await getAllTransactions(filter, mockTransactionRepository)

    expect(mockFindByFilter).toHaveBeenCalledWith(filter)
  })

  it("取引が存在しない場合、空配列と合計金額0を返す", async () => {
    mockFindByFilter.mockResolvedValue([])

    const result = await getAllTransactions({ userId: 1 }, mockTransactionRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.transactions).toEqual([])
      expect(result.value.totalAmount).toBe(0)
    }
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockFindByFilter.mockRejectedValue(new Error("Database connection failed"))

    await expect(getAllTransactions({ userId: 1 }, mockTransactionRepository)).rejects.toThrow()
  })
})
