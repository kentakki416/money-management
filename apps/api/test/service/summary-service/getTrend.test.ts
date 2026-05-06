import { SummaryRepository } from "../../../src/repository/mysql/summary-repository"
import { getTrend } from "../../../src/service/summary-service"
import { MonthlyTrend } from "../../../src/types/domain/summary"

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
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

    const mockTrendData: MonthlyTrend[] = [
      { amount: 1000, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食", month: currentMonth, year: currentYear },
      { amount: 2000, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食", month: prevMonth, year: prevYear },
    ]
    mockGetMonthlyTrend.mockResolvedValue(mockTrendData)

    const result = await getTrend(1, 3, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.categories).toHaveLength(1)
      expect(result.value.categories[0].categoryId).toBe(1)
      expect(result.value.months).toHaveLength(3)
    }
  })

  it("欠損月は0で補完される", async () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const mockTrendData: MonthlyTrend[] = [
      { amount: 5000, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食", month: currentMonth, year: currentYear },
    ]
    mockGetMonthlyTrend.mockResolvedValue(mockTrendData)

    const result = await getTrend(1, 3, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      const category = result.value.categories[0]
      expect(category.data).toHaveLength(3)
      const lastData = category.data[category.data.length - 1]
      expect(lastData.amount).toBe(5000)
      category.data.slice(0, -1).forEach((d) => expect(d.amount).toBe(0))
    }
  })

  it("月リストがN月分正しく生成される", async () => {
    mockGetMonthlyTrend.mockResolvedValue([])
    const months = 6

    const result = await getTrend(1, months, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.months).toHaveLength(months)
  })

  it("合計データ（total）が正しく集計される", async () => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    const mockTrendData: MonthlyTrend[] = [
      { amount: 3000, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食", month: currentMonth, year: currentYear },
      { amount: 1000, categoryColor: "#36A2EB", categoryId: 2, categoryName: "交通", month: currentMonth, year: currentYear },
    ]
    mockGetMonthlyTrend.mockResolvedValue(mockTrendData)

    const result = await getTrend(1, 2, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      const lastTotal = result.value.total[result.value.total.length - 1]
      expect(lastTotal.amount).toBe(4000)
    }
  })

  it("データが0件の場合、空のcategoriesと0の合計を返す", async () => {
    mockGetMonthlyTrend.mockResolvedValue([])

    const result = await getTrend(1, 3, { summaryRepository: mockSummaryRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.categories).toHaveLength(0)
      result.value.total.forEach((t) => expect(t.amount).toBe(0))
    }
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockGetMonthlyTrend.mockRejectedValue(new Error("Database connection failed"))
    await expect(getTrend(1, 3, { summaryRepository: mockSummaryRepository })).rejects.toThrow()
  })
})
