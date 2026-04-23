import { logger } from "../../log"
import { ParsedTransaction } from "../../types/domain/transaction"
import { convertCommaAmountToNumber, convertFullWidthToHalfWidth, splitCsvLineWithQuotes } from "../../utils/normalize"

/**
 * 説明文から分割払いの回数を抽出する（例: "15回払い 4回目" → 15）
 * 分割払いでない場合は null を返す
 */
const extractInstallmentCount = (description: string): number | null => {
  const match = description.match(/(\d+)回払い/)
  if (!match) return null
  const count = parseInt(match[1], 10)
  return count > 1 ? count : null
}

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
      let amount = convertCommaAmountToNumber(convertFullWidthToHalfWidth(amountStr))
      if (amount <= 0) {
        logger.info("MUFG CSV: skipped line (amount <= 0)", { amount, line: lineIndex + 1 })
        continue
      }

      /**
       * 分割払いの場合は総額を回数で割って1回あたりの支払額にする
       */
      const installmentCount = extractInstallmentCount(description)
      if (installmentCount) {
        const originalAmount = amount
        amount = Math.round(amount / installmentCount)
        logger.info("MUFG CSV: installment payment detected", {
          installmentCount,
          line: lineIndex + 1,
          originalAmount,
          perInstallmentAmount: amount,
        })
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
