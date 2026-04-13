import { PaymentSourceType } from "@repo/api-schema"

import { ParsedTransaction } from "@/types/domain/transaction"

import { parseMufgCsv } from "./mufg-parser"
import { parsePaypayCsv } from "./paypay-parser"
import { parseSmbcCsv } from "./smbc-parser"

export type CsvParserType = (content: string) => ParsedTransaction[]

const parserMap: Record<Exclude<PaymentSourceType, "MANUAL">, CsvParserType> = {
  MUFG: parseMufgCsv,
  PAYPAY: parsePaypayCsv,
  SMBC: parseSmbcCsv
}

export const getCsvParser = (type: PaymentSourceType): CsvParserType => {
  if (type === "MANUAL") {
    throw new Error("MANUAL type does not support CSV parsing")
  }
  return parserMap[type]
}

export { parseMufgCsv, parsePaypayCsv, parseSmbcCsv }