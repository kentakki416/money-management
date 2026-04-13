import { CategoryRepository } from "@/repository/mysql/category-repository"
import { getAllCategories } from "@/service/category-service"
import { Category } from "@/types/domain"

// モック
const mockFindAll = jest.fn<Promise<Category[]>, []>()

const mockCategoryRepository: CategoryRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: mockFindAll,
  findById: jest.fn(),
  update: jest.fn(),
}

describe("getAllCategories", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("カテゴリ一覧を返す", async () => {
    // Arrange
    const mockCategories: Category[] = [
      {
        id: 1,
        color: "#FF6384",
        name: "飲食",
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 2,
        color: "#36A2EB",
        name: "交通",
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockFindAll.mockResolvedValue(mockCategories)

    // Act
    const result = await getAllCategories(mockCategoryRepository)

    // Assert
    expect(result).toEqual(mockCategories)
    expect(result).toHaveLength(2)
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("カテゴリが存在しない場合、空配列を返す", async () => {
    // Arrange
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await getAllCategories(mockCategoryRepository)

    // Assert
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindAll.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getAllCategories(mockCategoryRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
