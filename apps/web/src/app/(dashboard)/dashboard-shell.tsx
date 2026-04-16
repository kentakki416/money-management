"use client"
import React from "react"

import AppHeader from "@/components/layout/AppHeader"
import AppSidebar from "@/components/layout/AppSidebar"
import Backdrop from "@/components/layout/Backdrop"
import { AuthProvider, User } from "@/features/auth/auth.context"
import { SidebarProvider, useSidebar } from "@/features/sidebar/sidebar.context"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[260px]"
      : "lg:ml-[70px]"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6">{children}</div>
      </div>
    </div>
  )
}

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: User | null
}) {
  return (
    <AuthProvider user={user}>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </AuthProvider>
  )
}
