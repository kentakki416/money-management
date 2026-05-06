import { UserRepository } from "../../../src/repository/mysql/user-repository"
import { getUserById } from "../../../src/service/user-service"
import { User } from "../../../src/types/domain"

// モック
const mockFindById = jest.fn<Promise<User | null>, [number]>()

const mockUserRepository: UserRepository = {
  count: jest.fn(),
  countRegistrationsByPeriod: jest.fn(),
  create: jest.fn(),
  findByEmail: jest.fn(),
  findById: mockFindById,
}

describe("getUserById", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("ユーザーが存在する場合、ok: true でユーザー情報を返す", async () => {
    const mockUser: User = {
      avatarUrl: "https://example.com/avatar.jpg",
      createdAt: new Date(),
      email: "test@example.com",
      id: 1,
      name: "Test User",
      updatedAt: new Date(),
    }

    mockFindById.mockResolvedValue(mockUser)

    const result = await getUserById(1, { userRepository: mockUserRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockUser)
    }
  })

  it("ユーザーが存在しない場合、ok: false で 404 エラーを返す", async () => {
    mockFindById.mockResolvedValue(null)

    const result = await getUserById(999, { userRepository: mockUserRepository })

    /**
     * メッセージ本文は検証しない（変更に強くするため）
     */
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.statusCode).toBe(404)
      expect(result.error.type).toBe("NOT_FOUND")
    }
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockFindById.mockRejectedValue(new Error("Database connection failed"))

    /**
     * 業務エラーではなく throw されることを確認（メッセージは検証しない）
     */
    await expect(getUserById(1, { userRepository: mockUserRepository })).rejects.toThrow()
  })
})
