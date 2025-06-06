"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { Send, LogOut, Bot, User, Copy, Brain, History } from "lucide-react"
import DarkModeToggle from "@/components/dark-mode-toggle"
import { MemoryManager } from "@/lib/memory"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [error, setError] = useState("")
  const [sessionId, setSessionId] = useState<string>("")
  const [memoryEnabled, setMemoryEnabled] = useState(true)
  const [showMemoryStatus, setShowMemoryStatus] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const memoryManager = MemoryManager.getInstance()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        setLoading(false)
        // Generate session ID
        setSessionId(Date.now().toString())
        // Load previous conversation if exists
        loadPreviousConversation(user.uid)
      } else {
        router.push("/")
      }
    })
    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "2.75rem"
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`
    }
  }, [input])

  // Save conversation to memory when messages change
  useEffect(() => {
    if (user && sessionId && messages.length > 0 && memoryEnabled) {
      memoryManager.saveConversation(user.uid, sessionId, messages)
    }
  }, [messages, user, sessionId, memoryEnabled])

  const loadPreviousConversation = (userId: string) => {
    try {
      const userHistory = memoryManager.getUserHistory(userId)
      if (userHistory.length > 0) {
        setShowMemoryStatus(true)
        setTimeout(() => setShowMemoryStatus(false), 3000)
      }
    } catch (error) {
      console.warn("Failed to load previous conversation:", error)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text) return

    // Limit message length to 2000 characters
    const limitedText = text.length > 2000 ? text.substring(0, 2000) + "..." : text

    const userMessage: Message = {
      id: Date.now().toString(),
      content: limitedText,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => {
      const newMessages = [...prev, userMessage]

      // Save to memory immediately after adding user message
      if (memoryEnabled && user && sessionId) {
        setTimeout(() => {
          memoryManager.saveConversation(user.uid, sessionId, newMessages)
        }, 100)
      }

      return newMessages
    })

    setInput("")
    setIsTyping(true)
    setError("")
    setSuggestions([])

    try {
      // Generate context from memory if enabled - include current conversation
      let context = ""
      if (memoryEnabled && user) {
        // Get existing context
        context = memoryManager.generateContextPrompt(user.uid, sessionId)

        // Add current conversation to context
        const currentMessages = [...messages, userMessage]
        if (currentMessages.length > 0) {
          context += "\n--- CURRENT SESSION ---\n"
          currentMessages.slice(-10).forEach((msg) => {
            context += `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.content}\n`
          })
          context += "--- END CURRENT SESSION ---\n\n"
        }
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: text,
          context: context,
          userId: user?.uid,
          sessionId: sessionId,
          conversationHistory: messages.slice(-6).map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Limit AI response length if needed
      const aiContent = data.response.length > 5000 ? data.response.substring(0, 5000) + "..." : data.response

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiContent,
        sender: "ai",
        timestamp: new Date(),
      }

      setMessages((prev) => {
        const newMessages = [...prev, aiMessage]

        // Save complete conversation to memory
        if (memoryEnabled && user && sessionId) {
          setTimeout(() => {
            memoryManager.saveConversation(user.uid, sessionId, newMessages)
          }, 100)
        }

        return newMessages
      })

      setSuggestions(data.suggestions || [])
    } catch (error: any) {
      console.error("Error sending message:", error)
      setError(error.message || "Failed to get response")

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const toggleMemory = () => {
    setMemoryEnabled(!memoryEnabled)
    setShowMemoryStatus(true)
    setTimeout(() => setShowMemoryStatus(false), 2000)
  }

  const clearMemory = () => {
    if (user && confirm("Are you sure you want to clear all conversation memory? This cannot be undone.")) {
      // Clear current session
      localStorage.removeItem(`memory_${user.uid}_${sessionId}`)
      // Clear all user memories
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(`memory_${user.uid}_`))
      keys.forEach((key) => localStorage.removeItem(key))
      setShowMemoryStatus(true)
      setTimeout(() => setShowMemoryStatus(false), 2000)
    }
  }

  const checkMemoryStatus = () => {
    if (user && sessionId) {
      const memory = memoryManager.getConversationMemory(user.uid, sessionId)
      console.log("Current memory:", memory)
      const context = memoryManager.generateContextPrompt(user.uid, sessionId)
      console.log("Generated context:", context)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-[var(--accent)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-accent relative">
            <Bot className="w-5 h-5 text-white" />
            {memoryEnabled && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>Powered by Gemini AI • Online</span>
              {memoryEnabled && <Brain className="w-3 h-3 text-green-500" />}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Memory Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMemory}
              className={`btn-outline hover-scale text-xs px-2 py-1 ${memoryEnabled ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : ""}`}
              title={
                memoryEnabled
                  ? "Memory enabled - AI remembers conversations"
                  : "Memory disabled - Fresh conversation each time"
              }
            >
              <Brain className="w-3 h-3 mr-1" />
              {memoryEnabled ? "Memory On" : "Memory Off"}
            </button>
            <button
              onClick={clearMemory}
              className="btn-outline hover-scale text-xs px-2 py-1"
              title="Clear all conversation memory"
            >
              <History className="w-3 h-3" />
            </button>
            <button
              onClick={checkMemoryStatus}
              className="btn-outline hover-scale text-xs px-2 py-1"
              title="Debug memory status"
            >
              Debug
            </button>
          </div>

          <DarkModeToggle />
          <div className="flex items-center space-x-2">
            <div className="avatar">
              <img
                src={user?.photoURL || "/placeholder.svg"}
                alt={user?.displayName}
                className="w-full h-full rounded-full"
                style={{ display: user?.photoURL ? "block" : "none" }}
              />
              <div className="avatar-fallback" style={{ display: user?.photoURL ? "none" : "flex" }}>
                {user?.displayName?.charAt(0) || "U"}
              </div>
            </div>
            <span className="text-sm text-foreground hidden sm:block">
              {user?.displayName?.split(" ")[0] || "User"}
            </span>
          </div>
          <button onClick={handleSignOut} className="btn-outline hover-scale">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Memory Status */}
      {showMemoryStatus && (
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            {memoryEnabled
              ? "🧠 Memory enabled - AI will remember our conversations"
              : "🔄 Memory disabled - Fresh conversation mode"}
          </p>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Error Alert */}
        {error && (
          <div className="px-6 py-3 border-b">
            <div className="alert-destructive">{error}</div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-chat-background">
          {messages.length === 0 && (
            <div className="text-center py-12 animate-fadeIn">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 gradient-accent">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Welcome to AI Assistant</h3>
              <p className="text-sm mb-8 max-w-md mx-auto text-muted-foreground">
                I'm here to assist you with information, creative tasks, or just a friendly chat.
                {memoryEnabled && " I'll remember our conversations to provide better, personalized responses."}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {["Tell me a joke", "Explain quantum physics", "Write a poem", "Help me code"].map((prompt) => (
                  <button key={prompt} onClick={() => handleSendMessage(prompt)} className="btn-starter hover-scale">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"} animate-slideIn`}
            >
              {message.sender === "ai" && (
                <div className="avatar mt-1">
                  <div className="avatar-fallback">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}

              <div
                className={`group message-container ${message.sender === "user" ? "order-1" : ""}`}
                style={{
                  background: message.sender === "user" ? "var(--user-message-bg)" : "var(--ai-message-bg)",
                  color: message.sender === "user" ? "var(--user-message-text)" : "var(--ai-message-text)",
                  border: message.sender === "ai" ? `1px solid var(--border)` : "none",
                }}
              >
                <p className="message-content text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                  {message.content.length > 1000 ? `${message.content.substring(0, 1000)}...` : message.content}
                </p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-opacity-20 border-current">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <button
                    onClick={() => copyMessage(message.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    title="Copy message"
                  >
                    <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                  </button>
                </div>
              </div>

              {message.sender === "user" && (
                <div className="avatar mt-1">
                  <img
                    src={user?.photoURL || "/placeholder.svg"}
                    alt={user?.displayName}
                    className="w-full h-full rounded-full"
                    style={{ display: user?.photoURL ? "block" : "none" }}
                  />
                  <div className="avatar-fallback" style={{ display: user?.photoURL ? "none" : "flex" }}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start animate-slideIn">
              <div className="avatar mt-1">
                <div className="avatar-fallback">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              </div>
              <div
                className="p-4 rounded-2xl max-w-[200px]"
                style={{
                  background: "var(--ai-message-bg)",
                  border: `1px solid var(--border)`,
                  boxShadow: "var(--shadow)",
                }}
              >
                <div className="flex items-center space-x-2">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-6 py-4 border-t bg-background">
            <p className="text-xs font-medium mb-3 text-muted-foreground">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(suggestion)}
                  className="btn-suggestion hover-scale"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t bg-background">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              disabled={isTyping}
              className="chat-textarea"
              rows={1}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              className="btn-primary"
              style={{ height: "auto", alignSelf: "flex-end" }}
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
