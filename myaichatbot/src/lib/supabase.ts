import { createClient } from "@supabase/supabase-js"

// Check if Supabase environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only create client if both environment variables are present
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export interface ChatMessage {
  id: string
  user_id: string
  content: string
  sender: "user" | "ai"
  timestamp: string
  created_at?: string
}

export class MessageStorage {
  // Check if Supabase is available
  private static isSupabaseAvailable(): boolean {
    return supabase !== null
  }

  // Save a message to both Supabase and localStorage
  static async saveMessage(message: ChatMessage): Promise<void> {
    // Always save to localStorage first
    this.saveLocalMessage(message)

    if (!this.isSupabaseAvailable()) {
      console.log("Supabase not configured. Message saved to localStorage only.")
      return
    }

    try {
      const { error } = await supabase!.from("chat_messages").insert([
        {
          id: message.id,
          user_id: message.user_id,
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp,
        },
      ])

      if (error) {
        console.error("Error saving message to Supabase:", error)
        console.log("Message saved to localStorage as fallback")
      } else {
        console.log("Message saved to Supabase successfully")
      }
    } catch (error) {
      console.error("Failed to save message to Supabase:", error)
      console.log("Message saved to localStorage as fallback")
    }
  }

  // Get last 5 messages for a user
  static async getRecentMessages(userId: string): Promise<ChatMessage[]> {
    let messages: ChatMessage[] = []

    // Try Supabase first
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from("chat_messages")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(5)

        if (!error && data && data.length > 0) {
          messages = data.reverse() // Return in chronological order (oldest first)
          console.log(`Loaded ${messages.length} messages from Supabase`)
          return messages
        }
      } catch (error) {
        console.error("Failed to fetch from Supabase:", error)
      }
    }

    // Fallback to localStorage
    messages = this.getLocalMessages(userId)
    console.log(`Loaded ${messages.length} messages from localStorage`)
    return messages
  }

  // Get messages from localStorage
  private static getLocalMessages(userId: string): ChatMessage[] {
    try {
      const stored = localStorage.getItem(`chat_messages_${userId}`)
      if (stored) {
        const messages = JSON.parse(stored)
        // Return last 5 messages in chronological order
        return messages.slice(-5)
      }
    } catch (error) {
      console.error("Failed to get local messages:", error)
    }
    return []
  }

  // Save to localStorage
  private static saveLocalMessage(message: ChatMessage): void {
    try {
      const stored = localStorage.getItem(`chat_messages_${message.user_id}`)
      const messages = stored ? JSON.parse(stored) : []

      // Add new message
      messages.push(message)

      // Keep only last 20 messages in localStorage (more than we need for context)
      if (messages.length > 20) {
        messages.splice(0, messages.length - 20)
      }

      localStorage.setItem(`chat_messages_${message.user_id}`, JSON.stringify(messages))
      console.log(`Message saved to localStorage. Total messages: ${messages.length}`)
    } catch (error) {
      console.error("Failed to save local message:", error)
    }
  }

  // Clear all messages for a user
  static async clearUserMessages(userId: string): Promise<void> {
    // Clear localStorage
    localStorage.removeItem(`chat_messages_${userId}`)
    console.log("Cleared localStorage messages")

    if (!this.isSupabaseAvailable()) {
      return
    }

    try {
      const { error } = await supabase!.from("chat_messages").delete().eq("user_id", userId)

      if (error) {
        console.error("Error clearing Supabase messages:", error)
      } else {
        console.log("Cleared Supabase messages")
      }
    } catch (error) {
      console.error("Failed to clear Supabase messages:", error)
    }
  }

  // Debug function to check what messages are stored
  static async debugMessages(userId: string): Promise<void> {
    console.log("=== DEBUG: Checking stored messages ===")

    // Check localStorage
    const localMessages = this.getLocalMessages(userId)
    console.log("LocalStorage messages:", localMessages.length)
    localMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.sender}] ${msg.content.substring(0, 50)}...`)
    })

    // Check Supabase if available
    if (this.isSupabaseAvailable()) {
      try {
        const { data, error } = await supabase!
          .from("chat_messages")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(10)

        if (!error && data) {
          console.log("Supabase messages:", data.length)
          data.reverse().forEach((msg, index) => {
            console.log(`${index + 1}. [${msg.sender}] ${msg.content.substring(0, 50)}...`)
          })
        }
      } catch (error) {
        console.error("Failed to debug Supabase messages:", error)
      }
    }
    console.log("=== END DEBUG ===")
  }
}
