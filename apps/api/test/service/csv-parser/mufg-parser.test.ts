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
})
