import { UserCategoryRuleRepository } from "@/repository/mysql/user-category-rule-repository"
import { upsertUserCategoryRuleByKeyword } from "@/service/user-category-rule-service"
import { UserCategoryRule } from "@/types/domain"

// モック
const mockUpsertByKeyword = jest.fn<Promise<UserCategoryRule>, [number, string, number]>()

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  upsertByKeyword: mockUpsertByKeyword,
}

describe("upsertUserCategoryRuleByKeyword", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ルールが存在しない場合、新規作成して返す", async () => {
    // Arrange
    const mockRule: UserCategoryRule = {
      id: 1,
      categoryId: 2,
      categoryName: "交通",
      keyword: "電車",
      matchType: "PARTIAL",
      priority: 0,
      userId: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockUpsertByKeyword.mockResolvedValue(mockRule)

    // Act
    const result = await upsertUserCategoryRuleByKeyword(100, "電車", 2, { userCategoryRuleRepository: mockUserCategoryRuleRepository })

    // Assert
    expect(result).toEqual(mockRule)
    expect(mockUpsertByKeyword).toHaveBeenCalledWith(100, "電車", 2)
    expect(mockUpsertByKeyword).toHaveBeenCalledTimes(1)
  })

  it("ルールが既に存在する場合、更新して返す", async () => {
    // Arrange
    const updatedRule: UserCategoryRule = {
      id: 1,
      categoryId: 3,
      categoryName: "娯楽",
      keyword: "電車",
      matchType: "PARTIAL",
      priority: 0,
      userId: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockUpsertByKeyword.mockResolvedValue(updatedRule)

    // Act
    const result = await upsertUserCategoryRuleByKeyword(100, "電車", 3, { userCategoryRuleRepository: mockUserCategoryRuleRepository })

    // Assert
    expect(result).toEqual(updatedRule)
    expect(mockUpsertByKeyword).toHaveBeenCalledWith(100, "電車", 3)
    expect(mockUpsertByKeyword).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockUpsertByKeyword.mockRejectedValue(mockError)

    // Act & Assert
    await expect(
      upsertUserCategoryRuleByKeyword(100, "電車", 2, { userCategoryRuleRepository: mockUserCategoryRuleRepository })
    ).rejects.toThrow("Database connection failed")
    expect(mockUpsertByKeyword).toHaveBeenCalledWith(100, "電車", 2)
  })
})
