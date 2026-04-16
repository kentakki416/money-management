"use client"
import { CheckCircle2, Info, X, XCircle } from "lucide-react"
import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

type ToastKind = "error" | "info" | "success"

type Toast = {
  id: string
  kind: ToastKind
  message: string
}

type ToastContextType = {
  /**
   * トーストを表示する
   * 第2引数を省略すると info 扱い
   */
  showToast: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

/**
 * トースト表示用のフック
 * 使用例: const { showToast } = useToast()
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

/**
 * 自動消去までの時間（ミリ秒）
 */
const AUTO_DISMISS_MS = 3500

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, kind: ToastKind = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { id, kind, message }])
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * 画面右下にトーストをスタック表示するコンテナ
 */
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[]
  onDismiss: (id: string) => void
}) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

/**
 * 個別のトースト
 * 自動で fade-in → 自動消去する
 */
function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    /**
     * マウント直後に fade-in するため一瞬遅延させる
     */
    const showTimer = setTimeout(() => setVisible(true), 10)

    /**
     * 自動消去
     */
    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 200)
    }, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
    }
  }, [toast.id, onDismiss])

  const icon =
    toast.kind === "success" ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : toast.kind === "error" ? (
      <XCircle className="h-5 w-5 text-red-500" />
    ) : (
      <Info className="h-5 w-5 text-blue-500" />
    )

  const bgClass =
    toast.kind === "success"
      ? "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/20"
      : toast.kind === "error"
        ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20"
        : "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/20"

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-200 ${bgClass} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">{icon}</div>
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{toast.message}</p>
      <button
        aria-label="閉じる"
        className="flex-shrink-0 rounded text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(toast.id), 200)
        }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
