export interface ConversationMemory {
  userId: string
  sessionId: string
  messages: Array<{
    role: "user" | "assistant"
    content: string
    timestamp: Date
  }>
  context: {
    topics: string[]
    userPreferences: Record<string, any>
    conversationSummary: string
    lastInteraction: Date
  }
}

export interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export class MemoryManager {
  private static instance: MemoryManager
  private memories: Map<string, ConversationMemory> = new Map()

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager()
    }
    return MemoryManager.instance
  }

  // Check if localStorage is available
  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === "undefined") return false
      const test = "__localStorage_test__"
      window.localStorage.setItem(test, test)
      window.localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  // Save conversation to memory
  saveConversation(userId: string, sessionId: string, messages: Message[]): void {
    if (!userId || !sessionId || !Array.isArray(messages)) {
      console.warn("Invalid parameters for saveConversation")
      return
    }

    const memoryKey = `${userId}_${sessionId}`
    const memory: ConversationMemory = {
      userId,
      sessionId,
      messages: messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content || "",
        timestamp: msg.timestamp || new Date(),
      })),
      context: {
        topics: this.extractTopics(messages),
        userPreferences: this.extractPreferences(messages),
        conversationSummary: this.generateSummary(messages),
        lastInteraction: new Date(),
      },
    }

    this.memories.set(memoryKey, memory)
    this.saveToLocalStorage(memoryKey, memory)
  }

  // Retrieve conversation memory
  getConversationMemory(userId: string, sessionId: string): ConversationMemory | null {
    if (!userId || !sessionId) return null

    const memoryKey = `${userId}_${sessionId}`
    let memory: ConversationMemory | undefined = this.memories.get(memoryKey)

    if (!memory) {
      memory = this.loadFromLocalStorage(memoryKey)
      if (memory) {
        this.memories.set(memoryKey, memory)
      }
    }

    return memory || null
  }

  // Get user's conversation history across all sessions
  getUserHistory(userId: string): ConversationMemory[] {
    if (!userId) return []

    const userMemories: ConversationMemory[] = []

    // Check in-memory storage
    const entries = Array.from(this.memories.entries())
    for (const [key, memory] of entries) {
      if (memory.userId === userId) {
        userMemories.push(memory)
      }
    }

    // Check localStorage for additional sessions (only if available)
    if (this.isLocalStorageAvailable()) {
      try {
        const keys = Object.keys(window.localStorage).filter((key) => key.startsWith(`memory_${userId}_`))

        for (const key of keys) {
          const memoryKey = key.replace("memory_", "")
          if (!this.memories.has(memoryKey)) {
            const memory = this.loadFromLocalStorage(memoryKey)
            if (memory) {
              userMemories.push(memory)
            }
          }
        }
      } catch (error) {
        console.warn("Error accessing localStorage:", error)
      }
    }

    return userMemories.sort((a, b) => b.context.lastInteraction.getTime() - a.context.lastInteraction.getTime())
  }

  // Generate context for AI prompt
  generateContextPrompt(userId: string, currentSessionId: string): string {
    if (!userId || !currentSessionId) return ""

    const userHistory = this.getUserHistory(userId)
    const currentMemory = this.getConversationMemory(userId, currentSessionId)

    if (userHistory.length === 0 && (!currentMemory || currentMemory.messages.length === 0)) {
      return ""
    }

    let contextPrompt = "\n\n--- USER MEMORY CONTEXT ---\n"

    // Add user preferences and personal information
    if (currentMemory?.context.userPreferences) {
      const prefs = Object.entries(currentMemory.context.userPreferences)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ")
      if (prefs) {
        contextPrompt += `IMPORTANT - User preferences and personal info: ${prefs}\n`
      }
    }

    // Extract and highlight names from conversation history
    const names = this.extractUserNames(userHistory, currentMemory)
    if (names.length > 0) {
      contextPrompt += `IMPORTANT - User's name(s): ${names.join(", ")} - Always use their name when appropriate!\n`
    }

    // Add recent conversation summaries
    const recentSessions = userHistory.slice(0, 3)
    if (recentSessions.length > 0) {
      contextPrompt += "\nRecent conversation summaries:\n"
      recentSessions.forEach((memory, index) => {
        if (memory.context && memory.context.conversationSummary) {
          contextPrompt += `${index + 1}. ${memory.context.conversationSummary}\n`
        }
      })
    }

    contextPrompt += "--- END MEMORY CONTEXT ---\n\n"
    contextPrompt +=
      "REMEMBER: Use any personal information (especially names) naturally in your responses. The user expects you to remember what they've told you.\n\n"

    return contextPrompt
  }

  // New method to extract user names from conversations
  private extractUserNames(userHistory: ConversationMemory[], currentMemory: ConversationMemory | null): string[] {
    const names: Set<string> = new Set()

    // Check current memory first
    if (currentMemory) {
      currentMemory.messages.forEach((msg) => {
        if (msg.role === "user") {
          this.extractNamesFromMessage(msg.content, names)
        }
      })
    }

    // Check historical conversations
    userHistory.forEach((memory) => {
      memory.messages.forEach((msg) => {
        if (msg.role === "user") {
          this.extractNamesFromMessage(msg.content, names)
        }
      })
    })

    return Array.from(names)
  }

  private extractNamesFromMessage(content: string, names: Set<string>): void {
    const lowerContent = content.toLowerCase()

    // Look for common name introduction patterns
    const namePatterns = [
      /my name is (\w+)/i,
      /i'm (\w+)/i,
      /i am (\w+)/i,
      /call me (\w+)/i,
      /name's (\w+)/i,
      /i'm called (\w+)/i,
    ]

    namePatterns.forEach((pattern) => {
      const match = content.match(pattern)
      if (match && match[1]) {
        const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()
        // Filter out common words that might be mistaken for names
        if (!this.isCommonWord(name.toLowerCase()) && name.length > 1) {
          names.add(name)
        }
      }
    })
  }

  private extractTopics(messages: Message[]): string[] {
    const topics: Set<string> = new Set()

    messages.forEach((msg) => {
      if (msg.sender === "user" && msg.content) {
        const content = msg.content.toLowerCase()
        // Simple keyword extraction
        const keywords = content.match(/\b\w{4,}\b/g) || []
        keywords.forEach((keyword) => {
          if (!this.isCommonWord(keyword)) {
            topics.add(keyword)
          }
        })
      }
    })

    return Array.from(topics).slice(0, 10) // Limit to 10 topics
  }

  private extractPreferences(messages: Message[]): Record<string, any> {
    const preferences: Record<string, any> = {}

    messages.forEach((msg) => {
      if (msg.sender === "user" && msg.content) {
        const content = msg.content.toLowerCase()

        // Extract language preferences
        if (content.includes("prefer") || content.includes("like")) {
          if (content.includes("language")) {
            const langMatch = content.match(/prefer\s+(\w+)\s+language|like\s+(\w+)\s+language/)
            if (langMatch) {
              preferences.preferredLanguage = langMatch[1] || langMatch[2]
            }
          }
        }

        // Extract communication style
        if (content.includes("formal") || content.includes("casual")) {
          preferences.communicationStyle = content.includes("formal") ? "formal" : "casual"
        }

        // Extract interests
        if (content.includes("interested in") || content.includes("love") || content.includes("enjoy")) {
          const interestMatch = content.match(/interested in (\w+)|love (\w+)|enjoy (\w+)/)
          if (interestMatch) {
            const interest = interestMatch[1] || interestMatch[2] || interestMatch[3]
            if (!preferences.interests) preferences.interests = []
            if (!preferences.interests.includes(interest)) {
              preferences.interests.push(interest)
            }
          }
        }
      }
    })

    return preferences
  }

  private generateSummary(messages: Message[]): string {
    if (messages.length === 0) return ""

    const userMessages = messages.filter((msg) => msg.sender === "user" && msg.content)
    const topics = this.extractTopics(messages)

    if (userMessages.length === 0) return ""

    const firstMessage = userMessages[0].content.substring(0, 100)
    const topicsStr = topics.slice(0, 3).join(", ")

    return `Discussed ${topicsStr}. Started with: "${firstMessage}${firstMessage.length >= 100 ? "..." : ""}"`
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
      "her",
      "was",
      "one",
      "our",
      "out",
      "day",
      "get",
      "has",
      "him",
      "his",
      "how",
      "its",
      "may",
      "new",
      "now",
      "old",
      "see",
      "two",
      "who",
      "boy",
      "did",
      "does",
      "let",
      "man",
      "way",
      "oil",
      "sit",
      "set",
      "run",
      "eat",
      "far",
      "sea",
      "eye",
      "ask",
      "own",
      "under",
      "think",
      "also",
      "back",
      "after",
      "first",
      "well",
      "year",
      "work",
      "such",
      "make",
      "even",
      "here",
      "only",
      "many",
      "know",
      "take",
      "than",
      "them",
      "good",
      "some",
      "this",
      "that",
      "with",
      "have",
      "from",
      "they",
      "been",
      "said",
      "each",
      "which",
      "their",
      "time",
      "will",
      "about",
      "would",
      "there",
      "could",
      "other",
      "more",
      "very",
      "what",
      "just",
      "into",
      "over",
      "think",
      "also",
    ])
    return commonWords.has(word.toLowerCase())
  }

  private saveToLocalStorage(memoryKey: string, memory: ConversationMemory): void {
    if (!this.isLocalStorageAvailable()) return

    try {
      const serializedMemory = {
        ...memory,
        messages: memory.messages.map((msg) => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        })),
        context: {
          ...memory.context,
          lastInteraction: memory.context.lastInteraction.toISOString(),
        },
      }

      window.localStorage.setItem(`memory_${memoryKey}`, JSON.stringify(serializedMemory))
    } catch (error) {
      console.warn("Failed to save memory to localStorage:", error)
    }
  }

  private loadFromLocalStorage(memoryKey: string): ConversationMemory | null {
    if (!this.isLocalStorageAvailable()) return null

    try {
      const stored = window.localStorage.getItem(`memory_${memoryKey}`)
      if (!stored) return null

      const parsed = JSON.parse(stored)

      // Validate the parsed data
      if (!parsed.userId || !parsed.sessionId || !Array.isArray(parsed.messages)) {
        console.warn("Invalid memory data structure")
        return null
      }

      return {
        ...parsed,
        messages: parsed.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        context: {
          ...parsed.context,
          lastInteraction: new Date(parsed.context.lastInteraction),
        },
      }
    } catch (error) {
      console.warn("Failed to load memory from localStorage:", error)
      return null
    }
  }

  // Clear old memories (keep only last 30 days)
  cleanupOldMemories(): void {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Clean in-memory storage
    const entries = Array.from(this.memories.entries())
    for (const [key, memory] of entries) {
      if (memory.context.lastInteraction < thirtyDaysAgo) {
        this.memories.delete(key)
      }
    }

    // Clean localStorage if available
    if (this.isLocalStorageAvailable()) {
      try {
        const keysToRemove: string[] = []

        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key && key.startsWith("memory_")) {
            const memoryKey = key.replace("memory_", "")
            const memory = this.loadFromLocalStorage(memoryKey)
            if (memory && memory.context.lastInteraction < thirtyDaysAgo) {
              keysToRemove.push(key)
            }
          }
        }

        keysToRemove.forEach((key) => {
          window.localStorage.removeItem(key)
        })
      } catch (error) {
        console.warn("Error during memory cleanup:", error)
      }
    }
  }

  // Clear all memories for a user
  clearUserMemories(userId: string): void {
    if (!userId) return

    // Clear in-memory storage
    const keysToDelete: string[] = []
    const entries = Array.from(this.memories.entries())
    for (const [key, memory] of entries) {
      if (memory.userId === userId) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach((key) => this.memories.delete(key))

    // Clear localStorage if available
    if (this.isLocalStorageAvailable()) {
      try {
        const keysToRemove: string[] = []

        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key && key.startsWith(`memory_${userId}_`)) {
            keysToRemove.push(key)
          }
        }

        keysToRemove.forEach((key) => {
          window.localStorage.removeItem(key)
        })
      } catch (error) {
        console.warn("Error clearing user memories:", error)
      }
    }
  }
}