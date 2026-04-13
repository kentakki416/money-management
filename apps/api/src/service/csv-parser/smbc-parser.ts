import { logger } from "../../log"
import { ParsedTransaction } from "../../types/domain/transaction"
import { convertCommaAmountToNumber, convertFullWidthToHalfWidth, splitCsvLineWithQuotes } from "../../utils/normalize"

export const parseSmbcCsv = (csvContent: string): ParsedTransaction[] => {
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "")
  const transactions: ParsedTransaction[] = []

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex]
    const cols = splitCsvLineWithQuotes(line)

    // ヘッダー行・合計行をスキップ。 ヘッダー：名前を含む行（「様」で判定）。合計行：先頭が空
    if (cols[0]?.includes("様") || cols[0]?.trim() === "") {
      continue
    }

    // 日付パース試行
    const dateStr = cols[0].trim()
    const dateMatch = dateStr?.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
    if (!dateMatch) {
      logger.info("SMBC CSV: skipped line (invalid date format)", { content: line, line: lineIndex + 1 })
      continue
    }
    const transactionDate = new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`)

    const description = convertFullWidthToHalfWidth(cols[1]?.trim() ?? "")
    const amountStr = cols[2]?.trim() ?? "0"
    const halfAmountStr = convertFullWidthToHalfWidth(amountStr)

    try {
      const amount = convertCommaAmountToNumber(halfAmountStr)
      if (amount <= 0) {
        logger.info("SMBC CSV: skipped line (amount <= 0)", { amount, line: lineIndex + 1 })
        continue
      }

      transactions.push({
        amount,
        description,
        transactionDate,
      })
    } catch (error) {
      logger.info("SMBC CSV: skipped line (parse error)", { content: line, error, line: lineIndex + 1 })
      continue
    }
  }

  return transactions
}