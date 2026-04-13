import fs from "fs"
import path from "path"

import { parseSmbcCsv } from "@/service/csv-parser/smbc-parser"

const CSV_PATH = path.resolve(__dirname, "../../../../../data/smbc-202603.csv")

describe("parseSmbcCsv", () => {
  const csv = fs.readFileSync(CSV_PATH, "utf-8")

  it("実際のCSVから取引データをパースできる", () => {
    const result = parseSmbcCsv(csv)

    expect(result.length).toBeGreaterThan(0)

    for (const tx of result) {
      expect(tx.amount).toBeGreaterThan(0)
      expect(tx.description).toBeTruthy()
      expect(tx.transactionDate).toBeInstanceOf(Date)
    }
  })

  it("先頭の取引が正しくパースされる", () => {
    const result = parseSmbcCsv(csv)
    expect(result[0]).toEqual({
      amount: 5000,
      description: "モバイルSuica(AppleV)",
      transactionDate: new Date("2026-02-03"),
    })
  })

  it("ヘッダー行・合計行はスキップされる", () => {
    const result = parseSmbcCsv(csv)
    const descriptions = result.map((t) => t.description)
    expect(descriptions.every((d) => !d.includes("様"))).toBe(true)
  })
})
