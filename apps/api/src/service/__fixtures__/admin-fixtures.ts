import { RegistrationPeriod, UserWithCounts, UserWithDetail } from "../../types/domain"

/**
 * 期間別ダミー登録推移データ
 */
export const DUMMY_REGISTRATIONS: Record<RegistrationPeriod, { count: number; label: string }[]> = {
  daily: [
    { count: 2, label: "00:00" },
    { count: 0, label: "01:00" },
    { count: 1, label: "02:00" },
    { count: 0, label: "03:00" },
    { count: 0, label: "04:00" },
    { count: 1, label: "05:00" },
    { count: 3, label: "06:00" },
    { count: 5, label: "07:00" },
    { count: 8, label: "08:00" },
    { count: 12, label: "09:00" },
    { count: 9, label: "10:00" },
    { count: 7, label: "11:00" },
    { count: 11, label: "12:00" },
    { count: 6, label: "13:00" },
    { count: 8, label: "14:00" },
    { count: 5, label: "15:00" },
    { count: 4, label: "16:00" },
    { count: 6, label: "17:00" },
    { count: 9, label: "18:00" },
    { count: 10, label: "19:00" },
    { count: 7, label: "20:00" },
    { count: 5, label: "21:00" },
    { count: 3, label: "22:00" },
    { count: 1, label: "23:00" },
  ],
  monthly: [
    { count: 3, label: "03/14" },
    { count: 5, label: "03/15" },
    { count: 2, label: "03/16" },
    { count: 8, label: "03/17" },
    { count: 4, label: "03/18" },
    { count: 6, label: "03/19" },
    { count: 7, label: "03/20" },
    { count: 3, label: "03/21" },
    { count: 9, label: "03/22" },
    { count: 5, label: "03/23" },
    { count: 4, label: "03/24" },
    { count: 6, label: "03/25" },
    { count: 8, label: "03/26" },
    { count: 3, label: "03/27" },
    { count: 7, label: "03/28" },
    { count: 5, label: "03/29" },
    { count: 4, label: "03/30" },
    { count: 6, label: "03/31" },
    { count: 9, label: "04/01" },
    { count: 3, label: "04/02" },
    { count: 5, label: "04/03" },
    { count: 7, label: "04/04" },
    { count: 4, label: "04/05" },
    { count: 8, label: "04/06" },
    { count: 6, label: "04/07" },
    { count: 3, label: "04/08" },
    { count: 5, label: "04/09" },
    { count: 7, label: "04/10" },
    { count: 4, label: "04/11" },
    { count: 6, label: "04/12" },
    { count: 8, label: "04/13" },
  ],
  weekly: [
    { count: 8, label: "04/07" },
    { count: 12, label: "04/08" },
    { count: 6, label: "04/09" },
    { count: 15, label: "04/10" },
    { count: 9, label: "04/11" },
    { count: 11, label: "04/12" },
    { count: 7, label: "04/13" },
  ],
  yearly: [
    { count: 12, label: "2025-05" },
    { count: 18, label: "2025-06" },
    { count: 25, label: "2025-07" },
    { count: 31, label: "2025-08" },
    { count: 22, label: "2025-09" },
    { count: 28, label: "2025-10" },
    { count: 35, label: "2025-11" },
    { count: 42, label: "2025-12" },
    { count: 38, label: "2026-01" },
    { count: 45, label: "2026-02" },
    { count: 41, label: "2026-03" },
    { count: 33, label: "2026-04" },
  ],
}

const now = new Date()

/**
 * ダミーユーザー一覧データ
 */
export const DUMMY_USERS: UserWithCounts[] = [
  { avatarUrl: null, createdAt: new Date("2025-08-15"), csvUploadCount: 12, email: "tanaka@example.com", id: 1, name: "田中太郎", transactionCount: 342, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2025-09-03"), csvUploadCount: 8, email: "suzuki@example.com", id: 2, name: "鈴木花子", transactionCount: 215, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2025-10-21"), csvUploadCount: 15, email: "sato@example.com", id: 3, name: "佐藤一郎", transactionCount: 528, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2025-11-07"), csvUploadCount: 3, email: "yamada@example.com", id: 4, name: "山田美咲", transactionCount: 97, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2025-12-19"), csvUploadCount: 20, email: "watanabe@example.com", id: 5, name: "渡辺健太", transactionCount: 631, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-01-08"), csvUploadCount: 6, email: "ito@example.com", id: 6, name: "伊藤あかり", transactionCount: 184, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-01-25"), csvUploadCount: 11, email: "kobayashi@example.com", id: 7, name: "小林裕太", transactionCount: 403, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-02-14"), csvUploadCount: 9, email: "nakamura@example.com", id: 8, name: "中村さくら", transactionCount: 276, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-03-02"), csvUploadCount: 14, email: "kato@example.com", id: 9, name: "加藤大輔", transactionCount: 455, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-03-28"), csvUploadCount: 2, email: "yoshida@example.com", id: 10, name: "吉田由美", transactionCount: 63, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-04-05"), csvUploadCount: 7, email: "matsumoto@example.com", id: 11, name: "松本翔", transactionCount: 198, updatedAt: now },
  { avatarUrl: null, createdAt: new Date("2026-04-10"), csvUploadCount: 4, email: "inoue@example.com", id: 12, name: "井上真理", transactionCount: 122, updatedAt: now },
]

/**
 * ダミーユーザー詳細データを取得
 */
export const getDummyUserDetail = (id: number): UserWithDetail | null => {
  const user = DUMMY_USERS.find((u) => u.id === id)
  if (!user) return null
  return {
    ...user,
    paymentSources: [
      { id: 1, name: "三井住友カード", type: "SMBC" },
      { id: 2, name: "PayPay", type: "PAYPAY" },
    ],
  }
}

/**
 * ダミー統計の固定値
 */
export const DUMMY_TOTAL_USERS = 296
export const DUMMY_TOTAL_CSV_UPLOADS = 187
