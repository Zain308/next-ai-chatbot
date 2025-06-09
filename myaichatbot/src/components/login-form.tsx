"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth, googleProvider } from "@/lib/firebase"
import { signInWithPopup, onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Bot, Sparkles, MessageCircle, Zap, Shield, Users, Star } from "lucide-react"
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
    <div style={styles.loginContainer}>
      {/* Background decoration */}
      <div style={styles.backgroundDecoration}>
        <div style={{ ...styles.decorationCircle, ...styles.circle1 }}></div>
        <div style={{ ...styles.decorationCircle, ...styles.circle2 }}></div>
        <div style={{ ...styles.decorationCircle, ...styles.circle3 }}></div>
      </div>

      {/* Dark mode toggle */}
      <div style={styles.darkModeToggle}>
        <DarkModeToggle />
      </div>

      <div style={styles.loginContent}>
        {/* Main card */}
        <div style={styles.loginCard}>
          {/* Header */}
          <div style={styles.loginHeader}>
            <div style={styles.logoContainer}>
              <Bot style={styles.logoIcon} />
              <div style={styles.logoDecoration}>
                <Sparkles style={styles.sparkleIcon} />
              </div>
            </div>

            <h1 style={styles.title}>AI Assistant</h1>
            <p style={styles.subtitle}>Your intelligent conversation partner with memory</p>
          </div>

          {/* Features */}
          <div style={styles.featuresGrid}>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIconContainer, ...styles.feature1 }}>
                <MessageCircle style={styles.featureIcon} />
              </div>
              <p style={styles.featureText}>Smart Chat</p>
            </div>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIconContainer, ...styles.feature2 }}>
                <Zap style={styles.featureIcon} />
              </div>
              <p style={styles.featureText}>Fast Response</p>
            </div>
            <div style={styles.featureItem}>
              <div style={{ ...styles.featureIconContainer, ...styles.feature3 }}>
                <Sparkles style={styles.featureIcon} />
              </div>
              <p style={styles.featureText}>AI Memory</p>
            </div>
          </div>

          {/* Stats */}
          <div style={styles.statsContainer}>
            <div style={styles.statsRow}>
              <div style={styles.statItem}>
                <Users style={styles.statIcon} />
                <span style={styles.statText}>10K+ Users</span>
              </div>
              <div style={styles.statItem}>
                <Star style={styles.statIcon} />
                <span style={styles.statText}>4.9 Rating</span>
              </div>
              <div style={styles.statItem}>
                <Shield style={styles.statIcon} />
                <span style={styles.statText}>Secure</span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert style={styles.errorAlert}>
              <AlertDescription style={styles.errorText}>{error}</AlertDescription>
            </Alert>
          )}

          {/* Login Button */}
          <Button onClick={handleGoogleLogin} disabled={loading} style={styles.loginButton}>
            {loading ? (
              <div style={styles.buttonContent}>
                <Loader2 style={styles.loaderIcon} />
                <span>Signing in...</span>
              </div>
            ) : (
              <div style={styles.buttonContent}>
                <svg style={styles.googleIcon} viewBox="0 0 24 24">
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
                <span>Continue with Google</span>
              </div>
            )}
          </Button>

          {/* Footer */}
          <div style={styles.loginFooter}>
            <p style={styles.footerText}>
              Secure authentication powered by Firebase
              <br />
              <span style={styles.footerSubtext}>Your conversations are stored securely with memory</span>
            </p>
          </div>
        </div>

        {/* Bottom decoration */}
        <div style={styles.bottomDecoration}>
          <div style={styles.decorationDots}>
            <div style={{ ...styles.decorationDot, ...styles.dot1 }}></div>
            <div style={{ ...styles.decorationDot, ...styles.dot2 }}></div>
            <div style={{ ...styles.decorationDot, ...styles.dot3 }}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

// All styles defined as JavaScript objects
const styles = {
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    background: "linear-gradient(135deg, #ebf4ff 0%, white 50%, #f5f3ff 100%)",
    position: "relative",
    overflow: "hidden",
  },
  backgroundDecoration: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  decorationCircle: {
    position: "absolute",
    borderRadius: "50%",
    mixBlendMode: "multiply",
    filter: "blur(80px)",
    opacity: 0.2,
    animation: "pulse 4s infinite",
  },
  circle1: {
    width: "20rem",
    height: "20rem",
    backgroundColor: "#d8b4fe",
    top: "-10rem",
    right: "-10rem",
  },
  circle2: {
    width: "20rem",
    height: "20rem",
    backgroundColor: "#93c5fd",
    bottom: "-10rem",
    left: "-10rem",
    animationDelay: "0.5s",
  },
  circle3: {
    width: "20rem",
    height: "20rem",
    backgroundColor: "#f9a8d4",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    opacity: 0.1,
    animationDelay: "1s",
  },
  darkModeToggle: {
    position: "absolute",
    top: "1.5rem",
    right: "1.5rem",
    zIndex: 10,
  },
  loginContent: {
    position: "relative",
    width: "100%",
    maxWidth: "28rem",
  },
  loginCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(20px)",
    borderRadius: "1.5rem",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    padding: "2rem",
    animation: "fadeIn 0.5s ease-out",
  },
  loginHeader: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoContainer: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "5rem",
    height: "5rem",
    borderRadius: "1.25rem",
    background: "linear-gradient(to right, #3b82f6, #9333ea)",
    marginBottom: "1.5rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  logoIcon: {
    width: "2.5rem",
    height: "2.5rem",
    color: "white",
  },
  logoDecoration: {
    position: "absolute",
    top: "-0.5rem",
    right: "-0.5rem",
  },
  sparkleIcon: {
    width: "1.5rem",
    height: "1.5rem",
    color: "#facc15",
    animation: "pulse 2s infinite",
  },
  title: {
    fontSize: "2.25rem",
    fontWeight: 700,
    background: "linear-gradient(to right, #111827, #4b5563)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    marginBottom: "0.75rem",
  },
  subtitle: {
    color: "#4b5563",
    fontSize: "1rem",
    lineHeight: 1.75,
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  featureItem: {
    textAlign: "center",
    transition: "transform 0.2s",
  },
  featureIconContainer: {
    width: "3rem",
    height: "3rem",
    borderRadius: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 0.75rem",
    transition: "transform 0.2s",
  },
  feature1: {
    backgroundColor: "#dbeafe",
  },
  feature2: {
    backgroundColor: "#f3e8ff",
  },
  feature3: {
    backgroundColor: "#dcfce7",
  },
  featureIcon: {
    width: "1.5rem",
    height: "1.5rem",
  },
  featureText: {
    fontSize: "0.75rem",
    color: "#4b5563",
    fontWeight: 500,
  },
  statsContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: "0.75rem",
    padding: "1rem",
    marginBottom: "1.5rem",
  },
  statsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: "0.875rem",
  },
  statItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  statIcon: {
    width: "1rem",
    height: "1rem",
    color: "#6b7280",
  },
  statText: {
    color: "#4b5563",
  },
  errorAlert: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    marginBottom: "1.5rem",
    animation: "slideIn 0.3s ease-out",
  },
  errorText: {
    fontSize: "0.875rem",
  },
  loginButton: {
    width: "100%",
    height: "3.5rem",
    background: "linear-gradient(to right, #2563eb, #9333ea)",
    color: "white",
    fontWeight: 600,
    borderRadius: "0.75rem",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    transition: "all 0.3s",
    transform: "scale(1)",
    opacity: 1,
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loaderIcon: {
    marginRight: "0.75rem",
    width: "1.5rem",
    height: "1.5rem",
    animation: "spin 1s linear infinite",
  },
  googleIcon: {
    marginRight: "0.75rem",
    width: "1.5rem",
    height: "1.5rem",
  },
  loginFooter: {
    textAlign: "center",
    marginTop: "2rem",
    paddingTop: "1.5rem",
    borderTop: "1px solid #e5e7eb",
  },
  footerText: {
    fontSize: "0.75rem",
    color: "#6b7280",
    lineHeight: 1.75,
  },
  footerSubtext: {
    color: "#9ca3af",
  },
  bottomDecoration: {
    textAlign: "center",
    marginTop: "2rem",
  },
  decorationDots: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#9ca3af",
  },
  decorationDot: {
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "50%",
    animation: "pulse 2s infinite",
  },
  dot1: {
    backgroundColor: "#60a5fa",
  },
  dot2: {
    backgroundColor: "#a78bfa",
    animationDelay: "0.5s",
  },
  dot3: {
    backgroundColor: "#f472b6",
    animationDelay: "1s",
  },
} as const

// Add global styles for animations
const globalStyles = `
  @keyframes pulse {
    0%, 100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.3;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-color-scheme: dark) {
    .loginContainer {
      background: linear-gradient(135deg, #111827 0%, #1f2937 50%, #111827 100%);
    }

    .loginCard {
      backgroundColor: rgba(31, 41, 55, 0.8);
      borderColor: rgba(55, 65, 81, 0.2);
    }

    .title {
      background: linear-gradient(to right, white, #d1d5db);
    }

    .subtitle, .featureText, .statText {
      color: #9ca3af;
    }

    .feature1 {
      backgroundColor: rgba(29, 78, 216, 0.3);
    }
    
    .feature2 {
      backgroundColor: rgba(124, 58, 237, 0.3);
    }
    
    .feature3 {
      backgroundColor: rgba(22, 163, 74, 0.3);
    }

    .feature1 .featureIcon {
      color: #60a5fa;
    }
    
    .feature2 .featureIcon {
      color: #a78bfa;
    }
    
    .feature3 .featureIcon {
      color: #4ade80;
    }

    .statsContainer {
      backgroundColor: rgba(55, 65, 81, 0.5);
    }

    .errorAlert {
      backgroundColor: rgba(153, 27, 27, 0.2);
      borderColor: rgba(153, 27, 27, 0.8);
    }

    .loginFooter {
      borderTopColor: '#374151';
    }
  }
`

// Inject global styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style")
  styleElement.textContent = globalStyles
  document.head.appendChild(styleElement)
}
