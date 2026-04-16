import { CsvUploadRepository } from "../../../src/repository/mysql/csv-upload-repository"
import { getUploadHistory } from "../../../src/service/csv-upload-service"
import { CsvUpload } from "../../../src/types/domain/csv-upload"

// モック
const mockFindByUserId = jest.fn<Promise<CsvUpload[]>, [number]>()

const mockCsvUploadRepository: CsvUploadRepository = {
  count: jest.fn(),
  create: jest.fn(),
  deleteByIdWithTransactions: jest.fn(),
  existsByFileName: jest.fn(),
  existsByHash: jest.fn(),
  findByIdAndUser: jest.fn(),
  findByUserId: mockFindByUserId,
}

const mockCsvUpload: CsvUpload = {
  id: 1,
  fileHash: "abc123hash",
  fileName: "test.csv",
  paymentSourceId: 1,
  paymentSourceName: "テストカード",
  rowCount: 5,
  uploadedAt: new Date(),
  userId: 1,
}

describe("getUploadHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("アップロード履歴一覧を返す", async () => {
    const mockHistory: CsvUpload[] = [
      { ...mockCsvUpload, id: 2, fileName: "second.csv" },
      { ...mockCsvUpload, id: 1, fileName: "first.csv" },
    ]
    mockFindByUserId.mockResolvedValue(mockHistory)

    const result = await getUploadHistory(1, mockCsvUploadRepository)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value).toEqual(mockHistory)
      expect(result.value).toHaveLength(2)
    }
  })

  it("アップロード履歴が存在しない場合、空配列を返す", async () => {
    mockFindByUserId.mockResolvedValue([])

    const result = await getUploadHistory(1, mockCsvUploadRepository)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value).toEqual([])
  })

  it("指定したuserIdでリポジトリが呼ばれる", async () => {
    mockFindByUserId.mockResolvedValue([])
    await getUploadHistory(42, mockCsvUploadRepository)
    expect(mockFindByUserId).toHaveBeenCalledWith(42)
  })

  it("データベースエラー時は例外として伝播する", async () => {
    mockFindByUserId.mockRejectedValue(new Error("Database connection failed"))
    await expect(getUploadHistory(1, mockCsvUploadRepository)).rejects.toThrow()
  })
})
