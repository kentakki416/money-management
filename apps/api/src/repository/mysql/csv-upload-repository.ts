import { Prisma as PrismaTypes, PrismaClient } from "../../prisma/generated/client"
import { CsvUpload } from "../../types/domain"

/**
 * CSVアップロード作成時の入力
 */
export type CreateCsvUploadInput = {
  userId: number
  paymentSourceId: number
  fileName: string
  fileHash: string
  rowCount: number
}

/**
 * CSVアップロードリポジトリのインターフェース
 */
export interface CsvUploadRepository {
  create(data: CreateCsvUploadInput): Promise<CsvUpload>
  existsByHash(fileHash: string): Promise<boolean>
  findByUserId(userId: number): Promise<CsvUpload[]>
}

type CsvUploadWithPaymentSource = PrismaTypes.CsvUploadGetPayload<{
  include: { paymentSource: true }
}>

/**
 * Prisma実装のCSVアップロードリポジトリ
 */
export class PrismaCsvUploadRepository implements CsvUploadRepository {
  private _prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this._prisma = prisma
  }

  async create(data: CreateCsvUploadInput): Promise<CsvUpload> {
    const csvUpload = await this._prisma.csvUpload.create({
      data: {
        fileHash: data.fileHash,
        fileName: data.fileName,
        paymentSourceId: data.paymentSourceId,
        rowCount: data.rowCount,
        userId: data.userId,
      },
      include: { paymentSource: true },
    })
    return this._toDomain(csvUpload)
  }

  async existsByHash(fileHash: string): Promise<boolean> {
    const csvUpload = await this._prisma.csvUpload.findUnique({
      where: { fileHash },
    })
    return csvUpload !== null
  }

  async findByUserId(userId: number): Promise<CsvUpload[]> {
    const csvUploads = await this._prisma.csvUpload.findMany({
      include: { paymentSource: true },
      orderBy: { id: "desc" },
      where: { userId },
    })
    return csvUploads.map((c) => this._toDomain(c))
  }

  /**
   * Prismaの型 → ドメインの型に変換
   */
  private _toDomain(c: CsvUploadWithPaymentSource): CsvUpload {
    return {
      id: c.id,
      fileHash: c.fileHash,
      fileName: c.fileName,
      paymentSourceId: c.paymentSourceId,
      paymentSourceName: c.paymentSource.name,
      rowCount: c.rowCount,
      uploadedAt: new Date(),
      userId: c.userId,
    }
  }
}
