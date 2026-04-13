import { CategoryRuleRepository, UpdateCategoryRuleInput } from "@/repository/mysql/category-rule-repository"
import { updateCategoryRule } from "@/service/category-rule-service"
import { CategoryRule } from "@/types/domain"

// モック
const mockUpdate = jest.fn<Promise<CategoryRule>, [number, UpdateCategoryRuleInput]>()

const mockCategoryRuleRepository: CategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  update: mockUpdate,
}

describe("updateCategoryRule", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリルールを更新して返す", async () => {
    // Arrange
    const input: UpdateCategoryRuleInput = {
      keyword: "コンビニ",
      priority: 20,
    }

    const updatedRule: CategoryRule = {
      id: 1,
      categoryId: 1,
      categoryName: "飲食",
      keyword: "コンビニ",
      matchType: "PARTIAL",
      priority: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockUpdate.mockResolvedValue(updatedRule)

    // Act
    const result = await updateCategoryRule(1, input, mockCategoryRuleRepository)

    // Assert
    expect(result).toEqual(updatedRule)
    expect(mockUpdate).toHaveBeenCalledWith(1, input)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const input: UpdateCategoryRuleInput = {
      keyword: "コンビニ",
    }

    const mockError = new Error("Database connection failed")
    mockUpdate.mockRejectedValue(mockError)

    // Act & Assert
    await expect(updateCategoryRule(1, input, mockCategoryRuleRepository)).rejects.toThrow(
      "Database connection failed"
    )
    expect(mockUpdate).toHaveBeenCalledWith(1, input)
  })
})
