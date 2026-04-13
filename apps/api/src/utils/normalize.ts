/**
 * 全角英数字・記号を半角に変換する
 */
export const convertFullWidthToHalfWidth = (str: string): string => {
  return str
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) =>
      String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
    )
    .replace(/　/g, " ")
    .replace(/[．]/g, ".")
    .replace(/[／]/g, "/")
    .replace(/[（]/g, "(")
    .replace(/[）]/g, ")")
    .replace(/[●]/g, "")
}

/**
 * CSVの1行をパースする（クォート内のカンマに対応）
 * 例: '"確定","4,592"' -> ["確定", "4,592"]
 */
export const splitCsvLineWithQuotes = (line: string): string[] => {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === "\"") {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

/**
 * カンマ区切りの数値文字列を数値に変換する
 * 例： "4,592" -> 4592, "5000" -> 5000
 */
export const convertCommaAmountToNumber = (str: string): number => {
  const cleaned = str.replace(/[,，円\s]/g, "").trim()
  const num = parseInt(cleaned, 10)
  if (isNaN(num)) {
    throw new Error(`Invalid amount: ${str}`)
  }
  return num
}