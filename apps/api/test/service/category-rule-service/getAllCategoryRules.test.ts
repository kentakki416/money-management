import { CategoryRuleRepository } from "@/repository/mysql/category-rule-repository"
import { getAllCategoryRules } from "@/service/category-rule-service"
import { CategoryRule } from "@/types/domain"

// モック
const mockFindAll = jest.fn<Promise<CategoryRule[]>, []>()

const mockCategoryRuleRepository: CategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: mockFindAll,
  update: jest.fn(),
}

describe("getAllCategoryRules", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリルール一覧を返す", async () => {
    // Arrange
    const mockRules: CategoryRule[] = [
      {
        id: 1,
        categoryId: 1,
        categoryName: "飲食",
        keyword: "スーパー",
        matchType: "PARTIAL",
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        categoryId: 2,
        categoryName: "交通",
        keyword: "電車",
        matchType: "PARTIAL",
        priority: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockFindAll.mockResolvedValue(mockRules)

    // Act
    const result = await getAllCategoryRules(mockCategoryRuleRepository)

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockRules)
      expect(result.value).toHaveLength(2)
    }
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("カテゴリルールが存在しない場合、空配列を返す", async () => {
    // Arrange
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await getAllCategoryRules(mockCategoryRuleRepository)

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
      expect(result.value).toHaveLength(0)
    }
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindAll.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getAllCategoryRules(mockCategoryRuleRepository)).rejects.toThrow()
  })
})
