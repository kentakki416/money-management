import { SummaryRepository } from "../../../src/repository/mysql/summary-repository"
import { getMonthlySummary } from "../../../src/service/summary-service"
import { CategorySummary } from "../../../src/types/domain/summary"

// モック
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
    // Arrange
    const mockCategories: CategorySummary[] = [
      {
        amount: 3000,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
      },
      {
        amount: 1000,
        categoryColor: "#36A2EB",
        categoryId: 2,
        categoryName: "交通",
      },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    // Act
    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.year).toBe(2026)
    expect(result.month).toBe(4)
    expect(result.totalAmount).toBe(4000)
    expect(result.categories).toHaveLength(2)
    expect(mockGetMonthlyCategorySummary).toHaveBeenCalledWith(1, 2026, 4)
    expect(mockGetMonthlyCategorySummary).toHaveBeenCalledTimes(1)
  })

  it("割合（percentage）が正しく計算される", async () => {
    // Arrange
    const mockCategories: CategorySummary[] = [
      {
        amount: 3000,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
      },
      {
        amount: 1000,
        categoryColor: "#36A2EB",
        categoryId: 2,
        categoryName: "交通",
      },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    // Act
    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    // Assert（合計4000に対して3000=75%, 1000=25%）
    expect(result.categories[0].percentage).toBe(75)
    expect(result.categories[1].percentage).toBe(25)
  })

  it("合計金額が正しく計算される", async () => {
    // Arrange
    const mockCategories: CategorySummary[] = [
      {
        amount: 1500,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
      },
      {
        amount: 2500,
        categoryColor: "#36A2EB",
        categoryId: 2,
        categoryName: "交通",
      },
      {
        amount: 500,
        categoryColor: "#FFCE56",
        categoryId: 3,
        categoryName: "娯楽",
      },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    // Act
    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.totalAmount).toBe(4500)
  })

  it("データが0件の場合、totalAmountが0で空配列を返す", async () => {
    // Arrange
    mockGetMonthlyCategorySummary.mockResolvedValue([])

    // Act
    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.totalAmount).toBe(0)
    expect(result.categories).toEqual([])
    expect(result.categories).toHaveLength(0)
  })

  it("データが0件の場合、percentageの計算でゼロ除算が発生しない", async () => {
    // Arrange
    mockGetMonthlyCategorySummary.mockResolvedValue([])

    // Act & Assert（エラーが発生しないこと）
    await expect(getMonthlySummary(1, 2026, 4, mockSummaryRepository)).resolves.not.toThrow()
  })

  it("割合が小数点1桁で四捨五入される", async () => {
    // Arrange（1/3 ≈ 33.3%）
    const mockCategories: CategorySummary[] = [
      {
        amount: 1,
        categoryColor: "#FF6384",
        categoryId: 1,
        categoryName: "飲食",
      },
      {
        amount: 2,
        categoryColor: "#36A2EB",
        categoryId: 2,
        categoryName: "交通",
      },
    ]
    mockGetMonthlyCategorySummary.mockResolvedValue(mockCategories)

    // Act
    const result = await getMonthlySummary(1, 2026, 4, mockSummaryRepository)

    // Assert
    expect(result.categories[0].percentage).toBe(33.3)
    expect(result.categories[1].percentage).toBe(66.7)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockGetMonthlyCategorySummary.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getMonthlySummary(1, 2026, 4, mockSummaryRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
