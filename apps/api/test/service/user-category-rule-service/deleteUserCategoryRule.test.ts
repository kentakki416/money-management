import { UserCategoryRuleRepository } from "@/repository/mysql/user-category-rule-repository"
import { deleteUserCategoryRule } from "@/service/user-category-rule-service"

// モック
const mockDeleteById = jest.fn<Promise<void>, [number, number]>()

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: mockDeleteById,
  findByUserId: jest.fn(),
  update: jest.fn(),
  upsertByKeyword: jest.fn(),
}

describe("deleteUserCategoryRule", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ユーザールールを削除する", async () => {
    // Arrange
    mockDeleteById.mockResolvedValue(undefined)

    // Act
    const result = await deleteUserCategoryRule(1, 100, mockUserCategoryRuleRepository)

    // Assert
    expect(result.ok).toBe(true)
    expect(mockDeleteById).toHaveBeenCalledWith(1, 100)
    expect(mockDeleteById).toHaveBeenCalledTimes(1)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockDeleteById.mockRejectedValue(mockError)

    // Act & Assert
    await expect(deleteUserCategoryRule(1, 100, mockUserCategoryRuleRepository)).rejects.toThrow()
    expect(mockDeleteById).toHaveBeenCalledWith(1, 100)
  })
})
