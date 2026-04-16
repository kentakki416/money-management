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
 * CSVアップロード削除時の戻り値
 */
export type DeleteCsvUploadResult = {
  deletedTransactionCount: number
}

/**
 * CSVアップロードリポジトリのインターフェース
 */
export interface CsvUploadRepository {
  count(): Promise<number>
  create(data: CreateCsvUploadInput): Promise<CsvUpload>
  deleteByIdWithTransactions(id: number, userId: number): Promise<DeleteCsvUploadResult>
  existsByFileName(userId: number, fileName: string): Promise<boolean>
  existsByHash(fileHash: string): Promise<boolean>
  findByIdAndUser(id: number, userId: number): Promise<CsvUpload | null>
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

  async count(): Promise<number> {
    return this._prisma.csvUpload.count()
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

  /**
   * CSV アップロードとそれに紐づく取引を一括削除する
   * 原子性を保つためトランザクション内で実行する
   * userId の所有権チェックは Service 側で事前に行う前提
   */
  async deleteByIdWithTransactions(id: number, userId: number): Promise<DeleteCsvUploadResult> {
    return this._prisma.$transaction(async (tx) => {
      /**
       * 関連取引を先に削除し、件数を返す
       */
      const { count } = await tx.transaction.deleteMany({
        where: { csvUploadId: id, userId },
      })

      await tx.csvUpload.delete({
        where: { id },
      })

      return { deletedTransactionCount: count }
    })
  }

  async findByIdAndUser(id: number, userId: number): Promise<CsvUpload | null> {
    const csvUpload = await this._prisma.csvUpload.findFirst({
      include: { paymentSource: true },
      where: { id, userId },
    })
    if (!csvUpload) return null
    return this._toDomain(csvUpload)
  }

  async existsByFileName(userId: number, fileName: string): Promise<boolean> {
    const csvUpload = await this._prisma.csvUpload.findFirst({
      where: { fileName, userId },
    })
    return csvUpload !== null
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
