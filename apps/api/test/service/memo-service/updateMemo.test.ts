import { MemoRepository, UpdateMemoInput } from "../../../src/repository/mysql/memo-repository"
import { updateMemo } from "../../../src/service/memo-service"
import { Memo } from "../../../src/types/domain"

// モック
const mockFindById = jest.fn<Promise<Memo | null>, [number]>()
const mockUpdate = jest.fn<Promise<Memo>, [number, UpdateMemoInput]>()

const mockMemoRepository: MemoRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: mockFindById,
  update: mockUpdate,
}

describe("updateMemo", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("メモが存在する場合、更新して返す", async () => {
    // Arrange
    const existingMemo: Memo = {
      body: "Old Body",
      createdAt: new Date(),
      id: 1,
      title: "Old Title",
      updatedAt: new Date(),
    }

    const input: UpdateMemoInput = {
      body: "Updated Body",
      title: "Updated Title",
    }

    const updatedMemo: Memo = {
      body: "Updated Body",
      createdAt: existingMemo.createdAt,
      id: 1,
      title: "Updated Title",
      updatedAt: new Date(),
    }

    mockFindById.mockResolvedValue(existingMemo)
    mockUpdate.mockResolvedValue(updatedMemo)

    const result = await updateMemo(1, input, mockMemoRepository)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(updatedMemo)
    expect(mockUpdate).toHaveBeenCalledWith(1, input)
  })

  it("メモが存在しない場合、ok: false で 404 エラーを返す", async () => {
    const input: UpdateMemoInput = { body: "B", title: "T" }
    mockFindById.mockResolvedValue(null)

    const result = await updateMemo(999, input, mockMemoRepository)

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error.statusCode).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("データベースエラー時は例外として伝播する", async () => {
    const input: UpdateMemoInput = { body: "B", title: "T" }
    mockFindById.mockRejectedValue(new Error("Database connection failed"))

    await expect(updateMemo(1, input, mockMemoRepository)).rejects.toThrow()
  })
})
