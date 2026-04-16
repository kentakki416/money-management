import { SummaryRepository } from "../../../src/repository/mysql/summary-repository"
import { getMonthlySummary } from "../../../src/service/summary-service"
import { CategorySummary } from "../../../src/types/domain/summary"

const mockGetMonthlyCategorySummary = jest.fn<
  Promise<CategorySummary[]>,
  [number, number, number]
>()

const mockSummaryRepository: SummaryRepository = {
  getDailySummary: jest.fn(),
  getMonthlyCategorySummary: mockGetMonthlyCategorySummary,
  getMonthlyTrend: jest.fn(),
}

describe("getMonthlySummary", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("月間カテゴリ別集計データを返す", async () => {
    const mockCategories: CategorySummary[] = [
      { amount: 3000, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食" },
      { amount: 1000, categoryColor: "#36A2EB", categoryId: 2, categoryName: "交通" },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.year).toBe(2026)
      expect(result.value.month).toBe(4)
      expect(result.value.totalAmount).toBe(4000)
      expect(result.value.categories).toHaveLength(2)
    }
  })

  it("割合（percentage）が正しく計算される", async () => {
    const mockCategories: CategorySummary[] = [
      { amount: 3000, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食" },
      { amount: 1000, categoryColor: "#36A2EB", categoryId: 2, categoryName: "交通" },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.categories[0].percentage).toBe(75)
      expect(result.value.categories[1].percentage).toBe(25)
    }
  })

  it("合計金額が正しく計算される", async () => {
    const mockCategories: CategorySummary[] = [
      { amount: 1500, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食" },
      { amount: 2500, categoryColor: "#36A2EB", categoryId: 2, categoryName: "交通" },
      { amount: 500, categoryColor: "#FFCE56", categoryId: 3, categoryName: "娯楽" },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.totalAmount).toBe(4500)
  })

  it("データが0件の場合、totalAmountが0で空配列を返す", async () => {
    mockGetMonthlyCategorySummary.mockResolvedValue([])

    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.totalAmount).toBe(0)
      expect(result.value.categories).toEqual([])
    }
  })

  it("データが0件の場合、percentageの計算でゼロ除算が発生しない", async () => {
    mockGetMonthlyCategorySummary.mockResolvedValue([])
    await expect(getMonthlySummary(1, 2026, 4, mockSummaryRepository)).resolves.not.toThrow()
  })

  it("割合が小数点1桁で四捨五入される", async () => {
    const mockCategories: CategorySummary[] = [
      { amount: 1, categoryColor: "#FF6384", categoryId: 1, categoryName: "飲食" },
      { amount: 2, categoryColor: "#36A2EB", categoryId: 2, categoryName: "交通" },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.categories[0].percentage).toBe(33.3)
      expect(result.value.categories[1].percentage).toBe(66.7)
    }
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockGetMonthlyCategorySummary.mockRejectedValue(new Error("Database connection failed"))
    await expect(getMonthlySummary(1, 2026, 4, mockSummaryRepository)).rejects.toThrow()
  })
})
