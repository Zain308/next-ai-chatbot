import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Chatbot - Intelligent Conversations",
  description: "Chat with our advanced AI assistant powered by Google's Gemini AI",
  keywords: ["AI", "chatbot", "artificial intelligence", "conversation", "assistant"],
  authors: [{ name: "Your Name" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
