import { CsvUploadRepository } from "../../../src/repository/mysql/csv-upload-repository"
import { getUploadHistory } from "../../../src/service/csv-upload-service"
import { CsvUpload } from "../../../src/types/domain/csv-upload"

// モック
const mockFindByUserId = jest.fn<Promise<CsvUpload[]>, [number]>()

const mockCsvUploadRepository: CsvUploadRepository = {
  create: jest.fn(),
  existsByHash: jest.fn(),
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
    // Arrange
    const mockHistory: CsvUpload[] = [
      { ...mockCsvUpload, id: 2, fileName: "second.csv" },
      { ...mockCsvUpload, id: 1, fileName: "first.csv" },
    ]
    mockFindByUserId.mockResolvedValue(mockHistory)

    // Act
    const result = await getUploadHistory(1, mockCsvUploadRepository)

    // Assert
    expect(result).toEqual(mockHistory)
    expect(result).toHaveLength(2)
    expect(mockFindByUserId).toHaveBeenCalledWith(1)
    expect(mockFindByUserId).toHaveBeenCalledTimes(1)
  })

  it("アップロード履歴が存在しない場合、空配列を返す", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])

    // Act
    const result = await getUploadHistory(1, mockCsvUploadRepository)

    // Assert
    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it("指定したuserIdでリポジトリが呼ばれる", async () => {
    // Arrange
    mockFindByUserId.mockResolvedValue([])

    // Act
    await getUploadHistory(42, mockCsvUploadRepository)

    // Assert
    expect(mockFindByUserId).toHaveBeenCalledWith(42)
  })

  it("データベースエラー時にエラーをスローする", async () => {
    // Arrange
    const mockError = new Error("Database connection failed")
    mockFindByUserId.mockRejectedValue(mockError)

    // Act & Assert
    await expect(getUploadHistory(1, mockCsvUploadRepository)).rejects.toThrow(
      "Database connection failed"
    )
  })
})
