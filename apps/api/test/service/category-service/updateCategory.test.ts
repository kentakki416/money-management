import { CategoryRepository, UpdateCateogryInput } from "@/repository/mysql/category-repository"
import { updateCategory } from "@/service/category-service"
import { Category } from "@/types/domain"

// モック
const mockFindById = jest.fn<Promise<Category | null>, [number]>()
const mockUpdate = jest.fn<Promise<Category>, [number, UpdateCateogryInput]>()

const mockCategoryRepository: CategoryRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: mockFindById,
  update: mockUpdate,
}

describe("updateCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリが存在する場合、更新して返す", async () => {
    // Arrange
    const existingCategory: Category = {
      id: 1,
      color: "#FF6384",
      name: "飲食",
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const input: UpdateCateogryInput = {
      name: "飲食費",
    }

    const updatedCategory: Category = {
      id: 1,
      color: "#FF6384",
      name: "飲食費",
      sortOrder: 1,
      createdAt: existingCategory.createdAt,
      updatedAt: new Date(),
    }

    mockFindById.mockResolvedValue(existingCategory)
    mockUpdate.mockResolvedValue(updatedCategory)

    // Act
    const result = await updateCategory(1, input, mockCategoryRepository)

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(updatedCategory)
    }
    expect(mockFindById).toHaveBeenCalledWith(1)
    expect(mockUpdate).toHaveBeenCalledWith(1, input)
  })

  it("カテゴリが存在しない場合、ok: false で 404 エラーを返す", async () => {
    // Arrange
    const input: UpdateCateogryInput = {
      name: "テスト",
    }

    mockFindById.mockResolvedValue(null)

    // Act
    const result = await updateCategory(999, input, mockCategoryRepository)

    // Assert
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.statusCode).toBe(404)
      expect(result.error.type).toBe("NOT_FOUND")
    }
    expect(mockFindById).toHaveBeenCalledWith(999)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const input: UpdateCateogryInput = {
      name: "テスト",
    }

    const mockError = new Error("Database connection failed")
    mockFindById.mockRejectedValue(mockError)

    // Act & Assert
    await expect(updateCategory(1, input, mockCategoryRepository)).rejects.toThrow()
    expect(mockFindById).toHaveBeenCalledWith(1)
  })
})
