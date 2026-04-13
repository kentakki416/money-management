import fs from "fs"
import path from "path"

import { parsePaypayCsv } from "@/service/csv-parser/paypay-parser"

const CSV_PATH = path.resolve(__dirname, "../../../../../data/PayPay-Transactions_20250101-20251231.csv")

describe("parsePaypayCsv", () => {
  const csv = fs.readFileSync(CSV_PATH, "utf-8")

  it("実際のCSVから取引データをパースできる", () => {
    const result = parsePaypayCsv(csv)

    expect(result.length).toBeGreaterThan(0)

    for (const tx of result) {
      expect(tx.amount).toBeGreaterThan(0)
      expect(tx.description).toBeTruthy()
      expect(tx.transactionDate).toBeInstanceOf(Date)
    }
  })

  it("チャージ行・ポイント獲得行はスキップされる", () => {
    const result = parsePaypayCsv(csv)
    const descriptions = result.map((t) => t.description)
    expect(descriptions.every((d) => d !== "PayPay" && !d.includes("ポイント"))).toBe(true)
  })

  it("送金の取引先が正しくパースされる", () => {
    const result = parsePaypayCsv(csv)
    // CSVの先頭行は送金（村田雅弥）
    expect(result[0]!.description).toBe("村田雅弥")
    expect(result[0]!.amount).toBe(2000)
  })
})
