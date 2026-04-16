"use client"
import React, { createContext, useContext, useMemo } from "react"

export type User = {
  avatar_url: string | null
  email: string
  id: number
  name: string
}

type AuthContextType = {
  logout: () => void
  user: User | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{
  children: React.ReactNode
  user: User | null
}> = ({ children, user }) => {
  /**
   * ログアウト: Cookie 削除 API を呼び出してサインインページにリダイレクト
   */
  const logout = () => {
    const form = document.createElement("form")
    form.method = "POST"
    form.action = "/api/auth/logout"
    document.body.appendChild(form)
    form.submit()
  }

  const value = useMemo(() => ({ logout, user }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
