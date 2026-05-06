import { CategoryRuleRepository, CreateCategoryRuleInput } from "@/repository/mysql/category-rule-repository"
import { createCategoryRule } from "@/service/category-rule-service"
import { CategoryRule } from "@/types/domain"

// モック
const mockCreate = jest.fn<Promise<CategoryRule>, [CreateCategoryRuleInput]>()

const mockCategoryRuleRepository: CategoryRuleRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
}

describe("createCategoryRule", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリルールを作成して返す", async () => {
    // Arrange
    const input: CreateCategoryRuleInput = {
      categoryId: 1,
      keyword: "スーパー",
      matchType: "PARTIAL",
      priority: 10,
    }

    const mockRule: CategoryRule = {
      id: 1,
      categoryId: 1,
      categoryName: "飲食",
      keyword: "スーパー",
      matchType: "PARTIAL",
      priority: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockCreate.mockResolvedValue(mockRule)

    // Act
    const result = await createCategoryRule(input, { categoryRuleRepository: mockCategoryRuleRepository })

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockRule)
    }
    expect(mockCreate).toHaveBeenCalledWith(input)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const input: CreateCategoryRuleInput = {
      categoryId: 1,
      keyword: "スーパー",
    }

    const mockError = new Error("Database connection failed")
    mockCreate.mockRejectedValue(mockError)

    // Act & Assert
    await expect(createCategoryRule(input, { categoryRuleRepository: mockCategoryRuleRepository })).rejects.toThrow()
    expect(mockCreate).toHaveBeenCalledWith(input)
  })
})
