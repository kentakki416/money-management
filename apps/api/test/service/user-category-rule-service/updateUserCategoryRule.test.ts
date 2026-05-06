import { UpdateUserCategoryRuleInput, UserCategoryRuleRepository } from "@/repository/mysql/user-category-rule-repository"
import { updateUserCategoryRule } from "@/service/user-category-rule-service"
import { UserCategoryRule } from "@/types/domain"

// モック
const mockUpdate = jest.fn<Promise<UserCategoryRule>, [number, number, UpdateUserCategoryRuleInput]>()

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  update: mockUpdate,
  upsertByKeyword: jest.fn(),
}

describe("updateUserCategoryRule", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ユーザールールを更新して返す", async () => {
    // Arrange
    const input: UpdateUserCategoryRuleInput = {
      keyword: "コンビニ",
      priority: 20,
    }

    const updatedRule: UserCategoryRule = {
      id: 1,
      categoryId: 1,
      categoryName: "飲食",
      keyword: "コンビニ",
      matchType: "PARTIAL",
      priority: 20,
      userId: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockUpdate.mockResolvedValue(updatedRule)

    // Act
    const result = await updateUserCategoryRule(1, 100, input, { userCategoryRuleRepository: mockUserCategoryRuleRepository })

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(updatedRule)
    }
    expect(mockUpdate).toHaveBeenCalledWith(1, 100, input)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const input: UpdateUserCategoryRuleInput = {
      keyword: "コンビニ",
    }

    const mockError = new Error("Database connection failed")
    mockUpdate.mockRejectedValue(mockError)

    // Act & Assert
    await expect(updateUserCategoryRule(1, 100, input, { userCategoryRuleRepository: mockUserCategoryRuleRepository })).rejects.toThrow()
    expect(mockUpdate).toHaveBeenCalledWith(1, 100, input)
  })
})
