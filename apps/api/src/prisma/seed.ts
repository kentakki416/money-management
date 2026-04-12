/* eslint-disable no-console */
import { MatchType } from "./generated/client"
import { prisma } from "./prisma.client"

const categories = [
  { id: 1, name: "飲食", color: "#FF6384", sortOrder: 1 },
  { id: 2, name: "交通", color: "#36A2EB", sortOrder: 2 },
  { id: 3, name: "美容・医療", color: "#FFCE56", sortOrder: 3 },
  { id: 4, name: "日用品", color: "#4BC0C0", sortOrder: 4 },
  { id: 5, name: "ショッピング", color: "#9966FF", sortOrder: 5 },
  { id: 6, name: "エンタメ", color: "#FF9F40", sortOrder: 6 },
  { id: 7, name: "通信・サブスク", color: "#C9CBCF", sortOrder: 7 },
  { id: 8, name: "光熱費", color: "#7BC8A4", sortOrder: 8 },
  { id: 9, name: "住居", color: "#E7E9ED", sortOrder: 9 },
  { id: 10, name: "送金・その他", color: "#8B8D91", sortOrder: 10 },
  { id: 99, name: "未分類", color: "#CCCCCC", sortOrder: 99 },
]

const categoryRules = [
  // 飲食
  { categoryId: 1, keyword: "スターバックス", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "サンマルクカフェ", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "マクドナルド", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "セブン-イレブン", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "まいばすけっと", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "ピーコックストア", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "鳥貴族", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "ワンカルビ", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 1, keyword: "ふたご", matchType: MatchType.PARTIAL, priority: 10 },
  // 交通
  { categoryId: 2, keyword: "Suica", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 2, keyword: "タクシー", matchType: MatchType.PARTIAL, priority: 10 },
  // 美容・医療
  { categoryId: 3, keyword: "クリニック", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 3, keyword: "医療法人", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 3, keyword: "OCEAN TOKYO", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 3, keyword: "メイクマン", matchType: MatchType.PARTIAL, priority: 10 },
  // ショッピング
  { categoryId: 5, keyword: "ユニクロ", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 5, keyword: "ZOZOTOWN", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 5, keyword: "AMAZON", matchType: MatchType.PARTIAL, priority: 5 },
  { categoryId: 5, keyword: "Amazon", matchType: MatchType.PARTIAL, priority: 5 },
  { categoryId: 5, keyword: "ケーズデンキ", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 5, keyword: "アイハーブ", matchType: MatchType.PARTIAL, priority: 10 },
  // エンタメ
  { categoryId: 6, keyword: "カラオケ館", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 6, keyword: "HAKADORU", matchType: MatchType.PARTIAL, priority: 10 },
  // 通信・サブスク
  { categoryId: 7, keyword: "APPLE COM BILL", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 7, keyword: "APPLE.COM/BILL", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 7, keyword: "CLAUDE.AI", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 7, keyword: "Amazonプライム", matchType: MatchType.PARTIAL, priority: 20 },
  { categoryId: 7, keyword: "AWS", matchType: MatchType.PARTIAL, priority: 10 },
  // 光熱費
  { categoryId: 8, keyword: "東京ガス", matchType: MatchType.PARTIAL, priority: 10 },
  // 日用品
  { categoryId: 4, keyword: "ChargeSPOT", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 4, keyword: "ヤマト運輸", matchType: MatchType.PARTIAL, priority: 10 },
  // 送金・その他
  { categoryId: 10, keyword: "送った金額", matchType: MatchType.PARTIAL, priority: 10 },
  { categoryId: 10, keyword: "チャージ", matchType: MatchType.EXACT, priority: 10 },
]

const seed = async () => {
  console.log("Seeding categories table...")
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name, color: category.color, sortOrder: category.sortOrder },
      create: category
    })
  }

  console.log("Seeding category rules...")
  // 既存ルールを全削除してから再投入
  await prisma.categoryRule.deleteMany()
  for (const rule of categoryRules) {
    await prisma.categoryRule.create({ data: rule })
  }

  console.log("Seed Completed ✅")
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
