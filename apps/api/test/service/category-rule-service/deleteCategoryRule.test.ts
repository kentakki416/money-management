import { CategoryRuleRepository } from "@/repository/mysql/category-rule-repository"
import { deleteCategoryRule } from "@/service/category-rule-service"

// モック
const mockDeleteById = jest.fn<Promise<void>, [number]>()

const mockCategoryRuleRepository: CategoryRuleRepository = {
  create: jest.fn(),
  deleteById: mockDeleteById,
  findAll: jest.fn(),
  update: jest.fn(),
}

describe("deleteCategoryRule", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリルールを削除する", async () => {
    // Arrange
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    await deleteCategoryRule(1, mockCategoryRuleRepository)

    // Assert
    expect(mockDeleteById).toHaveBeenCalledWith(1)
    expect(mockDeleteById).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockDeleteById.mockRejectedValue(mockError)

    // Act & Assert
    await expect(deleteCategoryRule(1, mockCategoryRuleRepository)).rejects.toThrow(
      "Database connection failed"
    )
    expect(mockDeleteById).toHaveBeenCalledWith(1)
  })
})
