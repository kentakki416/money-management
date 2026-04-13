import { logger } from "../../log"
import { ParsedTransaction } from "../../types/domain/transaction"
import { convertCommaAmountToNumber, splitCsvLineWithQuotes } from "../../utils/normalize"

export const parsePaypayCsv = (csvContent: string): ParsedTransaction[] => {
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "")
  const transactions: ParsedTransaction[] = []

  // 1行目はヘッダー
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    // CSV内のクォート付きカンマに対応した簡易パース
    const cols = splitCsvLineWithQuotes(line)

    // 出金金額（2列目）
    const outAmount = cols[1]?.trim() ?? "-"
    if (outAmount === "-" || outAmount === "") continue

    // 取引内容（8列目）
    const txContent = cols[7]?.trim() ?? ""
    // ポイント獲得・チャージはスキップ
    if (txContent.includes("ポイント") || txContent === "チャージ") continue

    // 取引先（9列目）を description に使用。なければ取引内容を使用
    const merchant = cols[8]?.trim() ?? ""
    const description = merchant || txContent

    // 日付パース（YYYY/MM/DD HH:MM:SS）
    const dateStr = cols[0]?.trim() ?? ""
    const dateMatch = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
    if (!dateMatch) {
      logger.info("PayPay CSV: skipped line (invalid date format)", { content: line, line: i + 1 })
      continue
    }

    try {
      const amount = convertCommaAmountToNumber(outAmount)
      if (amount <= 0) {
        logger.info("PayPay CSV: skipped line (amount <= 0)", { amount, line: i + 1 })
        continue
      }

      transactions.push({
        amount,
        description,
        transactionDate: new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`),
      })
    } catch (error) {
      logger.info("PayPay CSV: skipped line (parse error)", { content: line, error, line: i + 1 })
      continue
    }
  }

  return transactions
}
