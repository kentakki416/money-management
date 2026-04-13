export type CategoryRule = {
  id: number
  categoryId: number
  categoryName: string
  keyword: string
  matchType: "PARTIAL" | "EXACT"
  priority: number
  createdAt: Date
  updatedAt: Date
}