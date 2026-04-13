import { SummaryRepository } from "../../../src/repository/mysql/summary-repository"
import { getCalendarSummary } from "../../../src/service/summary-service"
import { DailySummary } from "../../../src/types/domain/summary"

// モック
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
    // Arrange
    const mockDays: DailySummary[] = [
      {
        amount: 1000,
        date: "2026-04-01",
        transactionCount: 2,
      },
      {
        amount: 2500,
        date: "2026-04-15",
        transactionCount: 3,
      },
    ]
    mockGetDailySummary.mockResolvedValue(mockDays)

    // Act
    const result = await getCalendarSummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.year).toBe(2026)
    expect(result.month).toBe(4)
    expect(result.days).toEqual(mockDays)
    expect(result.days).toHaveLength(2)
    expect(mockGetDailySummary).toHaveBeenCalledWith(1, 2026, 4)
    expect(mockGetDailySummary).toHaveBeenCalledTimes(1)
  })

  it("合計金額が正しく計算される", async () => {
    // Arrange
    const mockDays: DailySummary[] = [
      {
        amount: 1000,
        date: "2026-04-01",
        transactionCount: 1,
      },
      {
        amount: 2000,
        date: "2026-04-10",
        transactionCount: 2,
      },
      {
        amount: 500,
        date: "2026-04-20",
        transactionCount: 1,
      },
    ]
    mockGetDailySummary.mockResolvedValue(mockDays)

    // Act
    const result = await getCalendarSummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.totalAmount).toBe(3500)
  })

  it("データが0件の場合、totalAmountが0で空配列を返す", async () => {
    // Arrange
    mockGetDailySummary.mockResolvedValue([])

    // Act
    const result = await getCalendarSummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.totalAmount).toBe(0)
    expect(result.days).toEqual([])
    expect(result.days).toHaveLength(0)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockGetDailySummary.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getCalendarSummary(1, 2026, 4, mockSummaryRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
