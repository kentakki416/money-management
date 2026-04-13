import { CategoryRepository, CreateCateogryInput } from "@/repository/mysql/category-repository"
import { createCategory } from "@/service/category-service"
import { Category } from "@/types/domain"

// モック
const mockCreate = jest.fn<Promise<Category>, [CreateCateogryInput]>()

const mockCategoryRepository: CategoryRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}

describe("createCategory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリを作成して返す", async () => {
    // Arrange
    const input: CreateCateogryInput = {
      color: "#FF0000",
      name: "テスト",
      sortOrder: 0,
    }

    const mockCategory: Category = {
      id: 1,
      color: "#FF0000",
      name: "テスト",
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockCreate.mockResolvedValue(mockCategory)

    // Act
    const result = await createCategory(input, mockCategoryRepository)

    // Assert
    expect(result).toEqual(mockCategory)
    expect(mockCreate).toHaveBeenCalledWith(input)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const input: CreateCateogryInput = {
      color: "#FF0000",
      name: "テスト",
    }

    const mockError = new Error("Database connection failed")
    mockCreate.mockRejectedValue(mockError)

    // Act & Assert
    await expect(createCategory(input, mockCategoryRepository)).rejects.toThrow(
      "Database connection failed"
    )
    expect(mockCreate).toHaveBeenCalledWith(input)
  })
})
