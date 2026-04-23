import fs from "fs"
import path from "path"

import { parseMufgCsv } from "@/service/csv-parser/mufg-parser"

const CSV_PATH = path.resolve(__dirname, "../../../../../data/mufg-202603.csv")

describe("parseMufgCsv", () => {
  const csv = fs.readFileSync(CSV_PATH, "utf-8")

  it("実際のCSVから取引データをパースできる", () => {
    const result = parseMufgCsv(csv)

    expect(result.length).toBeGreaterThan(0)

    for (const tx of result) {
      expect(tx.amount).toBeGreaterThan(0)
      expect(tx.description).toBeTruthy()
      expect(tx.transactionDate).toBeInstanceOf(Date)
    }
  })

  it("先頭の取引（ZOZOTOWN）が正しくパースされる", () => {
    const result = parseMufgCsv(csv)
    expect(result[0]).toEqual({
      amount: 4592,
      description: "ZOZOTOWN",
      transactionDate: new Date("2026-01-19"),
    })
  })

  it("消費税行・分割払いヘッダー行はスキップされる", () => {
    const result = parseMufgCsv(csv)
    const descriptions = result.map((t) => t.description)
    expect(descriptions.every((d) => !d.includes("消費税") && !d.includes("≪"))).toBe(true)
  })

  it("分割払いの場合は総額を回数で割った金額になる", () => {
    const csvContent = [
      "確定,,Apple Store Shibuya15回払い 4回目,２０２５年１１月２８日,,,152804,,,,",
    ].join("\n")

    const result = parseMufgCsv(csvContent)
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(Math.round(152804 / 15))
    expect(result[0].description).toContain("15回払い 4回目")
  })

  it("一括払いの場合は金額がそのまま使われる", () => {
    const csvContent = [
      "確定,,ZOZOTOWN,２０２６年１月１９日,,,4592,,,,",
    ].join("\n")

    const result = parseMufgCsv(csvContent)
    expect(result).toHaveLength(1)
    expect(result[0].amount).toBe(4592)
  })
})
