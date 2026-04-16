import { MemoRepository } from "../../../src/repository/mysql/memo-repository"
import { getMemoById } from "../../../src/service/memo-service"
import { Memo } from "../../../src/types/domain"

const mockFindById = jest.fn<Promise<Memo | null>, [number]>()

const mockMemoRepository: MemoRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findById: mockFindById,
  update: jest.fn(),
}

describe("getMemoById", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("メモが存在する場合、ok: true でメモを返す", async () => {
    const mockMemo: Memo = {
      body: "Test Body",
      createdAt: new Date(),
      id: 1,
      title: "Test Title",
      updatedAt: new Date(),
    }
    mockFindById.mockResolvedValue(mockMemo)

    const result = await getMemoById(1, mockMemoRepository)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual(mockMemo)
  })

  it("メモが存在しない場合、ok: false で 404 エラーを返す", async () => {
    mockFindById.mockResolvedValue(null)

    const result = await getMemoById(999, mockMemoRepository)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.statusCode).toBe(404)
      expect(result.error.type).toBe("NOT_FOUND")
    }
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockFindById.mockRejectedValue(new Error("Database connection failed"))
    await expect(getMemoById(1, mockMemoRepository)).rejects.toThrow()
  })
})
