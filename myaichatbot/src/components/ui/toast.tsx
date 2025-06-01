"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  onClose: () => void
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn("fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm", {
        "bg-green-500 text-white": type === "success",
        "bg-red-500 text-white": type === "error",
        "bg-blue-500 text-white": type === "info",
      })}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white hover:text-gray-200">
          ×
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState<
    Array<{ id: string; message: string; type: "success" | "error" | "info" }>
  >([])

  const toast = React.useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const ToastContainer = React.useCallback(
    () => (
      <>
        {toasts.map(({ id, message, type }) => (
          <Toast key={id} message={message} type={type} onClose={() => removeToast(id)} />
        ))}
      </>
    ),
    [toasts, removeToast],
  )

  return {
    toast,
    ToastContainer,
  }
}
