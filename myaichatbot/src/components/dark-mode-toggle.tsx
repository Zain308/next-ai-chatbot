"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const initialDarkMode = savedTheme === "dark" || (!savedTheme && systemPrefersDark)
    setDarkMode(initialDarkMode)

    if (initialDarkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)

    if (newDarkMode) {
      document.body.classList.add("dark")
    } else {
      document.body.classList.remove("dark")
    }

    localStorage.setItem("theme", newDarkMode ? "dark" : "light")
  }

  if (!mounted) {
    return <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700"></div>
  }

  return (
    <button
      onClick={toggleDarkMode}
      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      style={{ background: "var(--bg-secondary)" }}
      aria-label="Toggle theme"
    >
      {darkMode ? (
        <Sun className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
      ) : (
        <Moon className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
      )}
    </button>
  )
}
