import { MemoRepository } from "../../../src/repository/mysql/memo-repository"
import { getAllMemos } from "../../../src/service/memo-service"
import { Memo } from "../../../src/types/domain"

// モック
const mockFindAll = jest.fn<Promise<Memo[]>, []>()

const mockMemoRepository: MemoRepository = {
  create: jest.fn(),
  deleteById: jest.fn(),
  findAll: mockFindAll,
  findById: jest.fn(),
  update: jest.fn(),
}

describe("getAllMemos", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("メモ一覧を返す", async () => {
    // Arrange
    const mockMemos: Memo[] = [
      {
        body: "Body 1",
        createdAt: new Date(),
        id: 1,
        title: "Title 1",
        updatedAt: new Date(),
      },
      {
        body: "Body 2",
        createdAt: new Date(),
        id: 2,
        title: "Title 2",
        updatedAt: new Date(),
      },
    ]

    mockFindAll.mockResolvedValue(mockMemos)

    const result = await getAllMemos({ memoRepository: mockMemoRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockMemos)
      expect(result.value).toHaveLength(2)
    }
  })

  it("メモが存在しない場合、空配列を返す", async () => {
    mockFindAll.mockResolvedValue([])

    const result = await getAllMemos({ memoRepository: mockMemoRepository })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual([])
    }
  })

  it("データベースエラー時にエラーをスローする", async () => {
    mockFindAll.mockRejectedValue(new Error("Database connection failed"))

    await expect(getAllMemos({ memoRepository: mockMemoRepository })).rejects.toThrow()
  })
})
