import { CategoryRuleRepository } from "../../../src/repository/mysql/category-rule-repository"
import { UserCategoryRuleRepository } from "../../../src/repository/mysql/user-category-rule-repository"
import { categorizeManyDescriptions } from "../../../src/service/categorize-service"
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

describe("categorizeManyDescriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("複数のdescriptionを一括でカテゴリIDに分類する", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([
      { ...baseUserCategoryRule, keyword: "スイカ", categoryId: 2 },
    ])
    mockFindAll.mockResolvedValue([
      { ...baseCategoryRule, keyword: "スタバ", categoryId: 1 },
    ])

    // Act
    const result = await categorizeManyDescriptions(
      1,
      ["スイカ利用", "スタバ購入", "不明な支出"],
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual([2, 1, 99])
    expect(result).toHaveLength(3)
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
    const result = await categorizeManyDescriptions(
      1,
      ["スタバで購入"],
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual([10])
  })

  it("空配列を渡した場合、空配列を返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await categorizeManyDescriptions(
      1,
      [],
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it("どのルールにもマッチしないdescriptionは99（未分類）になる", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])

    // Act
    const result = await categorizeManyDescriptions(
      1,
      ["不明A", "不明B", "不明C"],
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual([99, 99, 99])
  })

  it("ルール取得はユーザールール・マスタールールそれぞれ1回のみ呼ばれる", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])
    mockFindAll.mockResolvedValue([])

    // Act
    await categorizeManyDescriptions(
      1,
      ["説明1", "説明2", "説明3"],
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert（バルクのためリポジトリへのアクセスは1回のみ）
    expect(mockFindByUserId).toHaveBeenCalledTimes(1)
    expect(mockFindAll).toHaveBeenCalledTimes(1)
  })

  it("全角文字を半角に変換してマッチングする", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([
      { ...baseUserCategoryRule, keyword: "amazon", categoryId: 7 },
    ])
    mockFindAll.mockResolvedValue([])

    // Act（全角で渡す）
    const result = await categorizeManyDescriptions(
      1,
      ["ＡＭＡＺＯＮで購入"],
      mockCategoryRuleRepository,
      mockUserCategoryRuleRepository
    )

    // Assert
    expect(result).toEqual([7])
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindByUserId.mockRejectedValue(mockError)

    // Act & Assert
    await expect(
      categorizeManyDescriptions(
        1,
        ["テスト"],
        mockCategoryRuleRepository,
        mockUserCategoryRuleRepository
      )
    ).rejects.toThrow("Database connection failed")
  })
})
