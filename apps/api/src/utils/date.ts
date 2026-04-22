/**
 * 日付ユーティリティ
 *
 * new Date("YYYY-MM-DD") は UTC、new Date(year, month, day) はローカルTZ で解釈される。
 * この不一致によるバグを防ぐため、日付文字列を組み立ててから new Date() に渡す方式で統一する。
 */

/**
 * "YYYY-MM-DD" 形式の日付文字列を生成する
 */
export const formatDateString = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`

/**
 * 指定月の初日の Date を返す。monthは1始まり（1=1月, 12=12月）
 */
export const createMonthStartDate = (year: number, month: number): Date =>
  new Date(formatDateString(year, month, 1))

/**
 * 指定月の翌月初日の Date を返す。monthは1始まり。月末の範囲指定（lt）に使用する
 */
export const createNextMonthStartDate = (year: number, month: number): Date => {
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  return new Date(formatDateString(nextYear, nextMonth, 1))
}

/**
 * 指定日の翌日の Date を返す。日付の範囲指定（lt）に使用する
 */
export const createNextDayDate = (dateStr: string): Date => {
  const d = new Date(dateStr)
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + 1)
  return next
}
