import { CategoryRepository } from "@/repository/mysql/category-repository"
import { deleteCategory } from "@/service/category-service"
import { Category } from "@/types/domain"

// モック
const mockFindById = jest.fn<Promise<Category | null>, [number]>()
const mockDeleteById = jest.fn<Promise<void>, [number]>()

const mockCategoryRepository: CategoryRepository = {
  create: jest.fn(),
  deleteById: mockDeleteById,
  findAll: jest.fn(),
  findById: mockFindById,
  update: jest.fn(),
}

describe("deleteCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリが存在する場合、削除してtrueを返す", async () => {
    // Arrange
    const existingCategory: Category = {
      id: 1,
      color: "#FF6384",
      name: "飲食",
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockFindById.mockResolvedValue(existingCategory)
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    const result = await deleteCategory(1, mockCategoryRepository)

    // Assert
    expect(result).toBe(true)
    expect(mockFindById).toHaveBeenCalledWith(1)
    expect(mockDeleteById).toHaveBeenCalledWith(1)
  })

  it("カテゴリが存在しない場合、falseを返す", async () => {
    // Arrange
    mockFindById.mockResolvedValue(null)

    // Act
    const result = await deleteCategory(999, mockCategoryRepository)

    // Assert
    expect(result).toBe(false)
    expect(mockFindById).toHaveBeenCalledWith(999)
    expect(mockDeleteById).not.toHaveBeenCalled()
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindById.mockRejectedValue(mockError)

    // Act & Assert
    await expect(deleteCategory(1, mockCategoryRepository)).rejects.toThrow(
      "Database connection failed"
    )
    expect(mockFindById).toHaveBeenCalledWith(1)
  })
})
