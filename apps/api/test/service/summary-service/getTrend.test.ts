import { SummaryRepository } from "../../../src/repository/mysql/summary-repository"
import { getTrend } from "../../../src/service/summary-service"
import { MonthlyTrend } from "../../../src/types/domain/summary"

// モック
const mockGetMonthlyTrend = jest.fn<Promise<MonthlyTrend[]>, [number, number]>()

const mockSummaryRepository: SummaryRepository = {
  getDailySummary: jest.fn(),
  getMonthlyCategorySummary: jest.fn(),
  getMonthlyTrend: mockGetMonthlyTrend,
}

describe("getTrend", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリ別月次推移データを返す", async () => {
    // Arrange
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const mockTrendData: MonthlyTrend[] = [
      {
        amount: 1000,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
        month: currentMonth,
        year: currentYear,
      },
      {
        amount: 2000,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
        month: prevMonth,
        year: prevYear,
      },
    ]
    mockGetMonthlyTrend.mockResolvedValue(mockTrendData)

    // Act
    const result = await getTrend(1, 3, mockSummaryRepository)

    // Assert
    expect(result.categories).toHaveLength(1)
    expect(result.categories[0].categoryId).toBe(1)
    expect(result.categories[0].categoryName).toBe("飲食")
    expect(result.months).toHaveLength(3)
    expect(mockGetMonthlyTrend).toHaveBeenCalledWith(1, 3)
    expect(mockGetMonthlyTrend).toHaveBeenCalledTimes(1)
  })

  it("欠損月は0で補完される", async () => {
    // Arrange
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // 直近月のデータのみ存在（2ヶ月前は欠損）
    const mockTrendData: MonthlyTrend[] = [
      {
        amount: 5000,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
        month: currentMonth,
        year: currentYear,
      },
    ]
    mockGetMonthlyTrend.mockResolvedValue(mockTrendData)

    // Act
    const result = await getTrend(1, 3, mockSummaryRepository)

    // Assert
    const category = result.categories[0]
    expect(category.data).toHaveLength(3)

    // 直近月は5000、欠損月は0
    const lastData = category.data[category.data.length - 1]
    expect(lastData.amount).toBe(5000)
    expect(lastData.month).toBe(currentMonth)
    expect(lastData.year).toBe(currentYear)

    // 欠損月は0補完
    const olderData = category.data.slice(0, -1)
    olderData.forEach((d) => {
      expect(d.amount).toBe(0)
    })
  })

  it("月リストがN月分正しく生成される", async () => {
    // Arrange
    mockGetMonthlyTrend.mockResolvedValue([])

    const months = 6

    // Act
    const result = await getTrend(1, months, mockSummaryRepository)

    // Assert
    expect(result.months).toHaveLength(months)

    // 月リストが過去N月から現在月まで昇順
    const now = new Date()
    const expectedLastMonth = now.getMonth() + 1
    const expectedLastYear = now.getFullYear()
    const lastLabel = result.months[result.months.length - 1]
    expect(lastLabel.month).toBe(expectedLastMonth)
    expect(lastLabel.year).toBe(expectedLastYear)
  })

  it("合計データ（total）が正しく集計される", async () => {
    // Arrange
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const mockTrendData: MonthlyTrend[] = [
      {
        amount: 3000,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
        month: currentMonth,
        year: currentYear,
      },
      {
        amount: 1000,
        categoryColor: "#36A2EB",
        categoryId: 2,
        categoryName: "交通",
        month: currentMonth,
        year: currentYear,
      },
    ]
    mockGetMonthlyTrend.mockResolvedValue(mockTrendData)

    // Act
    const result = await getTrend(1, 2, mockSummaryRepository)

    // Assert
    const lastTotal = result.total[result.total.length - 1]
    expect(lastTotal.amount).toBe(4000)
    expect(lastTotal.month).toBe(currentMonth)
    expect(lastTotal.year).toBe(currentYear)
  })

  it("データが0件の場合、空のcategoriesと0の合計を返す", async () => {
    // Arrange
    mockGetMonthlyTrend.mockResolvedValue([])

    // Act
    const result = await getTrend(1, 3, mockSummaryRepository)

    // Assert
    expect(result.categories).toHaveLength(0)
    result.total.forEach((t) => {
      expect(t.amount).toBe(0)
    })
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockGetMonthlyTrend.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getTrend(1, 3, mockSummaryRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
