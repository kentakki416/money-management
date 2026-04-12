# Step3: CSVパーサー実装

各決済サービス（SMBC / MUFG / PayPay）のCSVフォーマットに対応するパーサーを実装する。

## 対応内容

### 1. 共通型定義

`apps/api/src/types/domain/parsed-transaction.ts` を作成:

```typescript
export type ParsedTransaction = {
  amount: number
  description: string
  transactionDate: Date
}
```

### 2. 全角→半角変換ユーティリティ

`apps/api/src/lib/normalize.ts` を作成:

```typescript
/**
 * 全角英数字・記号を半角に変換する
 */
export const toHalfWidth = (str: string): string => {
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
 * カンマ区切りの数値文字列を数値に変換する
 * 例: "4,592" → 4592, "5000" → 5000
 */
export const parseAmount = (str: string): number => {
  const cleaned = str.replace(/[,，円\s]/g, "").trim()
  const num = parseInt(cleaned, 10)
  if (isNaN(num)) {
    throw new Error(`Invalid amount: "${str}"`)
  }
  return num
}
```

### 3. SMBCパーサー

`apps/api/src/service/csv-parser/smbc-parser.ts` を作成:

CSVフォーマット:
```
藤森　健太　様,4980-05**-****-****,三井住友カードＶＩＳＡ（ＮＬ）
2026/02/03,モバイルＳｕｉｃａ（ＡｐｐｌｅＶ）●,5000,１,１,5000,
```

- 1行目はヘッダー（名前、カード番号、カード名）→ スキップ
- カード名ヘッダー行が途中に再出現する場合もスキップ
- 合計行（先頭カンマ）もスキップ
- 日付フォーマット: `YYYY/MM/DD`

```typescript
import { ParsedTransaction } from "../../types/domain/parsed-transaction"
import { parseAmount, toHalfWidth } from "../../lib/normalize"

export const parseSmbcCsv = (content: string): ParsedTransaction[] => {
  const lines = content.split("\n").filter((line) => line.trim() !== "")
  const transactions: ParsedTransaction[] = []

  for (const line of lines) {
    const cols = line.split(",")

    // ヘッダー行・合計行をスキップ
    // ヘッダー: 名前を含む行（「様」で判定）
    // 合計行: 先頭が空
    if (cols[0]?.includes("様") || cols[0]?.trim() === "") {
      continue
    }

    // 日付パース試行
    const dateStr = cols[0]?.trim()
    const dateMatch = dateStr?.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
    if (!dateMatch) {
      continue
    }

    const description = toHalfWidth(cols[1]?.trim() ?? "")
    const amountStr = cols[2]?.trim() ?? "0"

    try {
      const amount = parseAmount(toHalfWidth(amountStr))
      if (amount <= 0) continue

      transactions.push({
        amount,
        description,
        transactionDate: new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`),
      })
    } catch {
      // パース失敗行はスキップ
      continue
    }
  }

  return transactions
}
```

### 4. MUFGパーサー

`apps/api/src/service/csv-parser/mufg-parser.ts` を作成:

CSVフォーマット:
```
"確定情報","お支払日","ご利用店名（海外ご利用店名／海外都市名）","ご利用日","支払回数","何回目","ご利用金額（円）","現地通貨額..."
"","","【藤森　健太　様】","","","","",""
"確定","2026年3月10日","ＺＯＺＯＴＯＷＮ","2026年1月19日","　１","","4,592",""
```

- 1行目: ヘッダー → スキップ
- 2行目: 名前行（【】で囲まれている） → スキップ
- 「確定」で始まる行のみパース
- 分割払いの行（≪分割払い≫）もパース対象
- 消費税の補足行、空行はスキップ
- 日付フォーマット: `YYYY年M月D日`

```typescript
import { ParsedTransaction } from "../../types/domain/parsed-transaction"
import { parseAmount, toHalfWidth } from "../../lib/normalize"

const parseJapaneseDate = (dateStr: string): Date | null => {
  const normalized = toHalfWidth(dateStr)
  const match = normalized.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
  if (!match) return null
  const [, year, month, day] = match
  return new Date(`${year}-${month!.padStart(2, "0")}-${day!.padStart(2, "0")}`)
}

export const parseMufgCsv = (content: string): ParsedTransaction[] => {
  const lines = content.split("\n").filter((line) => line.trim() !== "")
  const transactions: ParsedTransaction[] = []

  for (const line of lines) {
    // CSVのクォートを除去してパース
    const cols = line.split(",").map((col) => col.replace(/^"|"$/g, "").trim())

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
    const description = toHalfWidth(rawDescription)

    // ご利用日（4列目）をパース
    const dateStr = cols[3] ?? ""
    const transactionDate = parseJapaneseDate(dateStr)
    if (!transactionDate) continue

    // ご利用金額（7列目）
    const amountStr = cols[6] ?? "0"
    try {
      const amount = parseAmount(toHalfWidth(amountStr))
      if (amount <= 0) continue

      transactions.push({
        amount,
        description,
        transactionDate,
      })
    } catch {
      continue
    }
  }

  return transactions
}
```

### 5. PayPayパーサー

`apps/api/src/service/csv-parser/paypay-parser.ts` を作成:

CSVフォーマット:
```
取引日,出金金額（円）,入金金額（円）,海外出金金額,...,取引内容,取引先,...
2025/12/30 18:33:22,"2,000",-,...,送った金額,村田雅弥,...
```

- 1行目: ヘッダー → スキップ
- 出金金額（2列目）が `-` でない行のみ対象（支出のみ取り込み）
- 「ポイント、残高の獲得」「チャージ」の取引内容は出金ではないのでスキップ
- 取引先（9列目）を description に使用
- 日付フォーマット: `YYYY/MM/DD HH:MM:SS`

```typescript
import { ParsedTransaction } from "../../types/domain/parsed-transaction"
import { parseAmount } from "../../lib/normalize"

export const parsePaypayCsv = (content: string): ParsedTransaction[] => {
  const lines = content.split("\n").filter((line) => line.trim() !== "")
  const transactions: ParsedTransaction[] = []

  // 1行目はヘッダー
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!
    // CSV内のクォート付きカンマに対応した簡易パース
    const cols = parseCsvLine(line)

    // 出金金額（2列目）
    const outAmount = cols[1]?.trim() ?? "-"
    if (outAmount === "-" || outAmount === "") continue

    // 取引内容（8列目）
    const content = cols[7]?.trim() ?? ""
    // ポイント獲得・チャージはスキップ
    if (content.includes("ポイント") || content === "チャージ") continue

    // 取引先（9列目）を description に使用。なければ取引内容を使用
    const merchant = cols[8]?.trim() ?? ""
    const description = merchant || content

    // 日付パース（YYYY/MM/DD HH:MM:SS）
    const dateStr = cols[0]?.trim() ?? ""
    const dateMatch = dateStr.match(/^(\d{4})\/(\d{2})\/(\d{2})/)
    if (!dateMatch) continue

    try {
      const amount = parseAmount(outAmount)
      if (amount <= 0) continue

      transactions.push({
        amount,
        description,
        transactionDate: new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`),
      })
    } catch {
      continue
    }
  }

  return transactions
}

/**
 * CSVの1行をパースする（クォート内のカンマに対応）
 */
const parseCsvLine = (line: string): string[] => {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]!
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
```

### 6. パーサーファクトリ

`apps/api/src/service/csv-parser/index.ts` を作成:

```typescript
import { PaymentSourceType } from "@repo/api-schema"

import { ParsedTransaction } from "../../types/domain/parsed-transaction"
import { parseMufgCsv } from "./mufg-parser"
import { parsePaypayCsv } from "./paypay-parser"
import { parseSmbcCsv } from "./smbc-parser"

export type CsvParserType = (content: string) => ParsedTransaction[]

const parserMap: Record<Exclude<PaymentSourceType, "MANUAL">, CsvParserType> = {
  MUFG: parseMufgCsv,
  PAYPAY: parsePaypayCsv,
  SMBC: parseSmbcCsv,
}

export const getCsvParser = (type: PaymentSourceType): CsvParserType => {
  if (type === "MANUAL") {
    throw new Error("MANUAL type does not support CSV parsing")
  }
  return parserMap[type]
}

export { parseMufgCsv, parsePaypayCsv, parseSmbcCsv }
```

## 動作確認

### ユニットテスト

`apps/api/src/service/csv-parser/__tests__/smbc-parser.test.ts` を作成:

```typescript
import { parseSmbcCsv } from "../smbc-parser"

describe("parseSmbcCsv", () => {
  it("should parse valid SMBC CSV content", () => {
    const csv = `藤森　健太　様,4980-05**-****-****,三井住友カードＶＩＳＡ（ＮＬ）
2026/02/03,モバイルＳｕｉｃａ（ＡｐｐｌｅＶ）●,5000,１,１,5000,
2026/02/13,スターバックスコーヒージャパン,740,１,１,740,
,,,,,114241,`

    const result = parseSmbcCsv(csv)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      amount: 5000,
      description: "モバイルSuica(AppleV)",
      transactionDate: new Date("2026-02-03"),
    })
    expect(result[1]).toEqual({
      amount: 740,
      description: "スターバックスコーヒージャパン",
      transactionDate: new Date("2026-02-13"),
    })
  })

  it("should skip header and total rows", () => {
    const csv = `藤森　健太　様,4980-05**-****-****,三井住友カードＶＩＳＡ（ＮＬ）
,,,,,0,`

    const result = parseSmbcCsv(csv)
    expect(result).toHaveLength(0)
  })
})
```

`apps/api/src/service/csv-parser/__tests__/mufg-parser.test.ts` を作成:

```typescript
import { parseMufgCsv } from "../mufg-parser"

describe("parseMufgCsv", () => {
  it("should parse valid MUFG CSV content", () => {
    const csv = `"確定情報","お支払日","ご利用店名","ご利用日","支払回数","何回目","ご利用金額（円）","現地通貨額"
"","","【藤森　健太　様】","","","","",""
"確定","2026年3月10日","ＺＯＺＯＴＯＷＮ","2026年1月19日","　１","","4,592",""`

    const result = parseMufgCsv(csv)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      amount: 4592,
      description: "ZOZOTOWN",
      transactionDate: new Date("2026-01-19"),
    })
  })
})
```

`apps/api/src/service/csv-parser/__tests__/paypay-parser.test.ts` を作成:

```typescript
import { parsePaypayCsv } from "../paypay-parser"

describe("parsePaypayCsv", () => {
  it("should parse valid PayPay CSV and filter out non-spending rows", () => {
    const csv = `取引日,出金金額（円）,入金金額（円）,海外出金金額,通貨,変換レート（円）,利用国,取引内容,取引先,取引方法,支払い区分,利用者,取引番号
2025/12/30 18:33:22,"2,000",-,-,-,-,-,送った金額,村田雅弥,PayPay残高,-,-,02167432925636018186
2025/12/30 18:33:20,-,"3,000",-,-,-,-,チャージ,PayPay,ゆうちょ銀行,-,-,02167432908456304652
2025/12/30 17:10:29,"3,850",-,-,-,-,-,支払い,HAKADORU　渋谷店 - HAKADORU　渋谷店,PayPay残高,-,-,04878538495828787202`

    const result = parsePaypayCsv(csv)
    expect(result).toHaveLength(2) // チャージ行は除外
    expect(result[0]!.description).toBe("村田雅弥")
    expect(result[0]!.amount).toBe(2000)
    expect(result[1]!.description).toBe("HAKADORU　渋谷店 - HAKADORU　渋谷店")
    expect(result[1]!.amount).toBe(3850)
  })
})
```

### テスト実行

```bash
cd apps/api
pnpm test -- --testPathPattern="csv-parser"
```

全テストがパスすることを確認する。
