import { SummaryRepository } from "../../../src/repository/mysql/summary-repository"
import { getCalendarSummary } from "../../../src/service/summary-service"
import { DailySummary } from "../../../src/types/domain/summary"

const mockGetDailySummary = jest.fn<Promise<DailySummary[]>, [number, number, number]>()

const mockSummaryRepository: SummaryRepository = {
  getDailySummary: mockGetDailySummary,
  getMonthlyCategorySummary: jest.fn(),
  getMonthlyTrend: jest.fn(),
}

describe("getCalendarSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("日別集計データを返す", async () => {
    const mockDays: DailySummary[] = [
      { amount: 1000, date: "2026-04-01", transactionCount: 2 },
      { amount: 2500, date: "2026-04-15", transactionCount: 3 },
    ]
    mockGetDailySummary.mockResolvedValue(mockDays)

    const result = await getCalendarSummary(1, 2026, 4, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.year).toBe(2026)
      expect(result.value.month).toBe(4)
      expect(result.value.days).toEqual(mockDays)
    }
  })

  it("合計金額が正しく計算される", async () => {
    const mockDays: DailySummary[] = [
      { amount: 1000, date: "2026-04-01", transactionCount: 1 },
      { amount: 2000, date: "2026-04-10", transactionCount: 2 },
      { amount: 500, date: "2026-04-20", transactionCount: 1 },
    ]
    mockGetDailySummary.mockResolvedValue(mockDays)

    const result = await getCalendarSummary(1, 2026, 4, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.totalAmount).toBe(3500)
  })

  it("データが0件の場合、totalAmountが0で空配列を返す", async () => {
    mockGetDailySummary.mockResolvedValue([])

    const result = await getCalendarSummary(1, 2026, 4, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.totalAmount).toBe(0)
      expect(result.value.days).toEqual([])
    }
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockGetDailySummary.mockRejectedValue(new Error("Database connection failed"))
    await expect(getCalendarSummary(1, 2026, 4, { summaryRepository: mockSummaryRepository })).rejects.toThrow()
  })
})
