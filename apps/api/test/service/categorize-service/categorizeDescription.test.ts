import { CategoryRuleRepository } from "../../../src/repository/mysql/category-rule-repository"
import { UserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { categorizeDescription } from "../../../src/service/categorize-service"
import { CategoryRule } from "../../../src/types/domain/category-rule"
import { UserCategoryRule } from "../../../src/types/domain/user-category-rule"

// モック
const mockFindAll = jest.fn<Promise<CategoryRule[]>, []>()
const mockFindByUserId = jest.fn<Promise<UserCategoryRule[]>, [number]>()

const mockCategoryRuleRepository: CategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: mockFindAll,
  update: jest.fn(),
}

const mockUserCategoryRuleRepository: UserCategoryRuleRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findByUserId: mockFindByUserId,
  update: jest.fn(),
  upsertByKeyword: jest.fn(),
}

const baseCategoryRule: CategoryRule = {
  id: 1,
  categoryId: 1,
  categoryName: "飲食",
  keyword: "スタバ",
  matchType: "PARTIAL",
  priority: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const baseUserCategoryRule: UserCategoryRule = {
  id: 1,
  userId: 1,
  categoryId: 2,
  categoryName: "交通",
  keyword: "スイカ",
  matchType: "PARTIAL",
  priority: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe("categorizeDescription", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ユーザールールにPARTIALマッチした場合、そのカテゴリIDを返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([{ ...baseUserCategoryRule, keyword: "スイカ", categoryId: 2 }])
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await categorizeDescription(
      1,
      "スイカで支払い",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(2)
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockFindAll).not.toHaveBeenCalled()
  })

  it("ユーザールールにEXACTマッチした場合、そのカテゴリIDを返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([
      { ...baseUserCategoryRule, keyword: "スタバ", matchType: "EXACT", categoryId: 5 },
    ])
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await categorizeDescription(
      1,
      "スタバ",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(5)
    expect(mockFindAll).not.toHaveBeenCalled()
  })

  it("ユーザールールのEXACTマッチは部分一致しない", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([
      { ...baseUserCategoryRule, keyword: "スタバ", matchType: "EXACT", categoryId: 5 },
    ])
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await categorizeDescription(
      1,
      "スタバで支払い",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(99)
  })

  it("ユーザールールにマッチしない場合、マスタールールを参照する", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([{ ...baseCategoryRule, keyword: "スタバ", categoryId: 1 }])

    // Act
    const result = await categorizeDescription(
      1,
      "スタバで購入",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(1)
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("マスタールールにEXACTマッチした場合、そのカテゴリIDを返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([
      { ...baseCategoryRule, keyword: "コンビニ", matchType: "EXACT", categoryId: 3 },
    ])

    // Act
    const result = await categorizeDescription(
      1,
      "コンビニ",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(3)
  })

  it("どのルールにもマッチしない場合は99（未分類）を返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await categorizeDescription(
      1,
      "不明な説明",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(99)
  })

  it("全角文字を半角に変換してマッチングする", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([
      { ...baseUserCategoryRule, keyword: "amazon", categoryId: 7 },
    ])
    mockFindAll.mockResolvedValue([])

    // Act（全角で渡す）
    const result = await categorizeDescription(
      1,
      "ＡＭＡＺＯＮ購入",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(7)
  })

  it("ユーザールールがマスタールールより優先される", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([
      { ...baseUserCategoryRule, keyword: "スタバ", categoryId: 10 },
    ])
    mockFindAll.mockResolvedValue([
      { ...baseCategoryRule, keyword: "スタバ", categoryId: 1 },
    ])

    // Act
    const result = await categorizeDescription(
      1,
      "スタバで支払い",
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toBe(10)
    expect(mockFindAll).not.toHaveBeenCalled()
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindByUserId.mockRejectedValue(mockError)

    // Act & Assert
    await expect(
      categorizeDescription(1, "テスト", mockCategoryRuleRepository, mockUserCategoryRuleRepository)
    ).rejects.toThrow("Database connection failed")
  })
})
