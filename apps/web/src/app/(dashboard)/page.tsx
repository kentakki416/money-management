"use client"
import { BarChart3, Calendar, ExternalLink, List, Upload } from "lucide-react"
import Link from "next/link"

import { useAuth } from "@/features/auth/auth.context"

const quickLinks = [
  {
    color: "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400",
    description: "CSVファイルで取引を一括取り込み",
    href: "/upload",
    icon: <Upload size={24} />,
    name: "CSVアップロード",
  },
  {
    color: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    description: "取引の確認・編集・手動登録",
    href: "/transactions",
    icon: <List size={24} />,
    name: "取引一覧",
  },
  {
    color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
    description: "日別の支出をカレンダーで確認",
    href: "/calendar",
    icon: <Calendar size={24} />,
    name: "カレンダー",
  },
  {
    color: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
    description: "カテゴリ別の支出推移を分析",
    href: "/charts",
    icon: <BarChart3 size={24} />,
    name: "グラフ",
  },
]

const csvDownloadGuides = [
  {
    color: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    description: "PayPayの取引履歴をCSVでダウンロードする方法",
    href: "https://paypay.ne.jp/notice/20250206/f-transactionhistory/",
    name: "PayPay",
  },
  {
    color: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
    description: "三菱UFJカードの明細をCSVでダウンロードするページ",
    href: "https://www2.mufgcard.com/inet/dy/meisaisyokai/index.html",
    name: "三菱UFJカード",
  },
  {
    color: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    description: "三井住友カードの明細をCSVでダウンロードするページ",
    href: "https://www.smbc-card.com/memx/web_meisai/top/index.html#info2",
    name: "三井住友カード",
  },
]

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* ウェルカムセクション */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white shadow-lg md:p-8">
        <h1 className="text-2xl font-bold md:text-3xl">
          おかえりなさい、{user?.name ?? "ユーザー"}さん
        </h1>
        <p className="mt-2 text-brand-100">
          今日も支出を確認して、賢くお金を管理しましょう。
        </p>
      </div>

      {/* クイックリンク */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          クイックアクセス
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-800"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${link.color}`}
              >
                {link.icon}
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {link.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* CSVダウンロード方法 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          CSVダウンロード方法
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {csvDownloadGuides.map((guide) => (
            <a
              key={guide.name}
              href={guide.href}
              rel="noopener noreferrer"
              target="_blank"
              className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-brand-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-800"
            >
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${guide.color}`}
              >
                <ExternalLink size={24} />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {guide.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {guide.description}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
