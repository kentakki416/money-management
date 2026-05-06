import { UserCategoryRuleRepository } from "@/repository/mysql/user-category-rule-repository"
import { getUserCategoryRules } from "@/service/user-category-rule-service"
import { UserCategoryRule } from "@/types/domain"

// モック
const mockFindByUserId = jest.fn<Promise<UserCategoryRule[]>, [number]>()

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findById: jest.fn(),
  findByUserId: mockFindByUserId,
  update: jest.fn(),
  upsertByKeyword: jest.fn(),
}

describe("getUserCategoryRules", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ユーザールール一覧を返す", async () => {
    // Arrange
    const mockRules: UserCategoryRule[] = [
      {
        id: 1,
        categoryId: 1,
        categoryName: "飲食",
        keyword: "スーパー",
        matchType: "PARTIAL",
        priority: 10,
        userId: 100,
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
        userId: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    mockFindByUserId.mockResolvedValue(mockRules)

    // Act
    const result = await getUserCategoryRules(100, { userCategoryRuleRepository: mockUserCategoryRuleRepository })

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockRules)
      expect(result.value).toHaveLength(2)
    }
    expect(mockFindByUserId).toHaveBeenCalledWith(100)
    expect(mockFindByUserId).toHaveBeenCalledTimes(1)
  })

  it("ユーザールールが存在しない場合、空配列を返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])

    // Act
    const result = await getUserCategoryRules(100, { userCategoryRuleRepository: mockUserCategoryRuleRepository })

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
      expect(result.value).toHaveLength(0)
    }
    expect(mockFindByUserId).toHaveBeenCalledWith(100)
    expect(mockFindByUserId).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindByUserId.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getUserCategoryRules(100, { userCategoryRuleRepository: mockUserCategoryRuleRepository })).rejects.toThrow()
  })
})
