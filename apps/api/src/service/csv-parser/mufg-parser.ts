import { logger } from "../../log"
import { ParsedTransaction } from "../../types/domain/transaction"
import { convertCommaAmountToNumber, convertFullWidthToHalfWidth, splitCsvLineWithQuotes } from "../../utils/normalize"

const parseJapaneseDate = (dateStr: string): Date | null => {
  const normalized = convertFullWidthToHalfWidth(dateStr)
  const match = normalized.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!match) return null
  const [, year, month, day] = match
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`)
}

export const parseMufgCsv = (csvContent: string): ParsedTransaction[] => {
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "")
  const transactions: ParsedTransaction[] = []

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    // クォート内のカンマに対応したパース
    const cols = splitCsvLineWithQuotes(line)

    // 「確定」で始まる行のみ処理
    if (cols[0] !== "確定") {
      continue
    }

    // ご利用店名（全角→半角変換）
    const rawDescription = cols[2] ?? ""
    // ≪分割払い≫ のヘッダー行はスキップ
    if (rawDescription.includes("≪") || rawDescription.includes("消費税")) {
      continue
    }
    const description = convertFullWidthToHalfWidth(rawDescription)

    // ご利用日（4列目）をパース
    const dateStr = cols[3] ?? ""
    const transactionDate = parseJapaneseDate(dateStr)
    if (!transactionDate) {
      logger.info("MUFG CSV: skipped line (invalid date format)", { content: line, line: lineIndex + 1 })
      continue
    }

    // ご利用金額（7列目）
    const amountStr = cols[6] ?? "0"
    try {
      const amount = convertCommaAmountToNumber(convertFullWidthToHalfWidth(amountStr))
      if (amount <= 0) {
        logger.info("MUFG CSV: skipped line (amount <= 0)", { amount, line: lineIndex + 1 })
        continue
      }

      transactions.push({
        amount,
        description,
        transactionDate,
      })
    } catch (error) {
      logger.info("MUFG CSV: skipped line (parse error)", { content: line, error, line: lineIndex + 1 })
      continue
    }
  }

  return transactions
}
