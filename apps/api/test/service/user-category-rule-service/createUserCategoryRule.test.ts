import { CreateUserCategoryRuleInput, UserCategoryRuleRepository } from "@/repository/mysql/user-category-rule-repository"
import { createUserCategoryRule } from "@/service/user-category-rule-service"
import { UserCategoryRule } from "@/types/domain"

// モック
const mockCreate = jest.fn<Promise<UserCategoryRule>, [number, CreateUserCategoryRuleInput]>()

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findByUserId: jest.fn(),
  update: jest.fn(),
  upsertByKeyword: jest.fn(),
}

describe("createUserCategoryRule", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ユーザールールを作成して返す", async () => {
    // Arrange
    const input: CreateUserCategoryRuleInput = {
      categoryId: 1,
      keyword: "スーパー",
      matchType: "PARTIAL",
      priority: 10,
    }

    const mockRule: UserCategoryRule = {
      id: 1,
      categoryId: 1,
      categoryName: "飲食",
      keyword: "スーパー",
      matchType: "PARTIAL",
      priority: 10,
      userId: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockCreate.mockResolvedValue(mockRule)

    // Act
    const result = await createUserCategoryRule(100, input, mockUserCategoryRuleRepository)

    // Assert
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockRule)
    }
    expect(mockCreate).toHaveBeenCalledWith(100, input)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const input: CreateUserCategoryRuleInput = {
      categoryId: 1,
      keyword: "スーパー",
    }

    const mockError = new Error("Database connection failed")
    mockCreate.mockRejectedValue(mockError)

    // Act & Assert
    await expect(createUserCategoryRule(100, input, mockUserCategoryRuleRepository)).rejects.toThrow()
    expect(mockCreate).toHaveBeenCalledWith(100, input)
  })
})
