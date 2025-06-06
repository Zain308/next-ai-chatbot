"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup, onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import DarkModeToggle from "./dark-mode-toggle"

export default function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/chat")
      }
    })
    return () => unsubscribe()
  }, [router])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError("")

    try {
      await signInWithPopup(auth, googleProvider)
      router.push("/chat")
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      setLoading(false)

      if (error.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Google Sign-In.")
      } else if (error.code === "auth/popup-closed-by-user") {
        // This is a user action, not an error - just reset the UI without showing an error
        setError("")
      } else if (error.code === "auth/popup-blocked") {
        setError("Pop-up was blocked. Please allow pop-ups and try again.")
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection.")
      } else {
        setError("Failed to sign in. Please try again.")
      }
    }
  }

  return (
    <div
      className="rounded-lg border p-6"
      style={{
        background: "var(--bg-primary)",
        borderColor: "var(--border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Welcome Back
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Sign in to continue
          </p>
        </div>
        <DarkModeToggle />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 text-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full h-10 text-sm"
        style={{
          background: loading ? "var(--bg-secondary)" : "#4285f4",
          color: "white",
          border: "none",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </>
        )}
      </Button>

      <div className="text-center pt-3">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Secure authentication powered by Firebase
        </p>
      </div>
    </div>
  )
}
