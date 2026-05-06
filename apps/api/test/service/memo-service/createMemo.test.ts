import { CreateMemoInput, MemoRepository } from "../../../src/repository/mysql/memo-repository"
import { createMemo } from "../../../src/service/memo-service"
import { Memo } from "../../../src/types/domain"

// モック
const mockCreate = jest.fn<Promise<Memo>, [CreateMemoInput]>()

const mockMemoRepository: MemoRepository = {
  create: mockCreate,
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
}

describe("createMemo", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("メモを作成して返す", async () => {
    // Arrange
    const input: CreateMemoInput = {
      body: "New Body",
      title: "New Title",
    }

    const mockMemo: Memo = {
      body: "New Body",
      createdAt: new Date(),
      id: 1,
      title: "New Title",
      updatedAt: new Date(),
    }

    mockCreate.mockResolvedValue(mockMemo)

    const result = await createMemo(input, { memoRepository: mockMemoRepository })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(mockMemo)
  })

  it("データベースエラー時は例外として伝播する", async () => {
    const input: CreateMemoInput = { body: "B", title: "T" }
    mockCreate.mockRejectedValue(new Error("Database connection failed"))

    await expect(createMemo(input, { memoRepository: mockMemoRepository })).rejects.toThrow()
  })
})
