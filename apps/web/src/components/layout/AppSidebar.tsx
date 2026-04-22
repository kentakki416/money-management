"use client"
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  List,
  ListFilter,
  Upload,
  Wallet,
} from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useCallback } from "react"

const DotLottieReact = dynamic(
  async () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false },
)

import { useSidebar } from "@/features/sidebar/sidebar.context"

type NavItem = {
  icon: React.ReactNode
  name: string
  path: string
}

const navItems: NavItem[] = [
  {
    icon: <LayoutDashboard size={20} />,
    name: "ダッシュボード",
    path: "/",
  },
  {
    icon: <Upload size={20} />,
    name: "CSVアップロード",
    path: "/upload",
  },
  {
    icon: <Calendar size={20} />,
    name: "カレンダー",
    path: "/calendar",
  },
  {
    icon: <List size={20} />,
    name: "取引一覧",
    path: "/transactions",
  },
  {
    icon: <BarChart3 size={20} />,
    name: "グラフ",
    path: "/charts",
  },
  {
    icon: <ListFilter size={20} />,
    name: "分類ルール",
    path: "/rules",
  },
]

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar()
  const pathname = usePathname()

  const isActive = useCallback((path: string) => path === pathname, [pathname])

  const isOpen = isExpanded || isHovered || isMobileOpen

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 h-screen bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 ease-in-out z-50
        ${isOpen ? "w-[260px]" : "w-[70px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ロゴ */}
      <div
        className={`flex h-16 items-center border-b border-gray-200 px-4 dark:border-gray-800 ${
          !isExpanded && !isHovered ? "lg:justify-center" : ""
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          {isOpen && (
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Money Manager
            </span>
          )}
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 no-scrollbar">
        <ul className="flex flex-col gap-1">
          {navItems.map((nav) => (
            <li key={nav.name}>
              <Link
                href={nav.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                  ${
            isActive(nav.path)
              ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            }
                  ${!isExpanded && !isHovered ? "lg:justify-center" : ""}
                `}
              >
                <span className="flex-shrink-0">{nav.icon}</span>
                {isOpen && <span>{nav.name}</span>}
              </Link>
            </li>
          ))}
        </ul>

        {/* kenttaki-bot */}
        <div className="mt-auto flex justify-center pb-4">
          <div className={`${isOpen ? "h-28 w-28" : "h-12 w-12"} transition-all duration-300`}>
            <DotLottieReact autoplay loop src="/kenttaki-bot.lottie" />
          </div>
        </div>
      </nav>
    </aside>
  )
}
