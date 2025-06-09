import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
  try {
    console.log("=== API CHAT ROUTE CALLED ===")

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not found in environment variables")
      return NextResponse.json(
        { error: "Gemini API key not configured. Please add GEMINI_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error("Failed to parse request body:", error)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { query, conversationHistory, userId } = body

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Valid query is required" }, { status: 400 })
    }

    console.log("User ID:", userId)
    console.log("Current query:", query.substring(0, 100) + "...")
    console.log("Conversation history received:", conversationHistory?.length || 0, "messages")

    // Log conversation history for debugging
    if (conversationHistory && Array.isArray(conversationHistory)) {
      console.log("=== CONVERSATION HISTORY ===")
      conversationHistory.forEach((msg: any, index: number) => {
        console.log(`${index + 1}. [${msg.role}] ${msg.content.substring(0, 100)}...`)
      })
      console.log("=== END CONVERSATION HISTORY ===")
    }

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Build enhanced prompt with conversation history
    let fullPrompt = ""

    // Enhanced system instructions with memory emphasis
    const systemInstruction = `You are an AI assistant with STRONG MEMORY capabilities. You MUST remember and reference previous conversations.

CRITICAL MEMORY RULES:
1. ALWAYS acknowledge when you remember something from our previous conversation
2. When a user mentions their name, REMEMBER IT and use it in future responses
3. Reference specific details from earlier messages when relevant
4. Build upon topics we've discussed before
5. If the user asks about something we talked about earlier, recall those details
6. Show that you remember by saying things like "As we discussed earlier..." or "I remember you mentioned..."
7. Maintain personality consistency throughout our conversation

IMPORTANT: The conversation history below contains our previous messages. Use this information to provide contextual, personalized responses that show you remember our conversation.`

    fullPrompt += systemInstruction + "\n\n"

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      fullPrompt += "=== OUR PREVIOUS CONVERSATION ===\n"
      conversationHistory.forEach((msg: any) => {
        const role = msg.role === "user" ? "Human" : "Assistant"
        fullPrompt += `${role}: ${msg.content}\n`
      })
      fullPrompt += "=== END PREVIOUS CONVERSATION ===\n\n"
      fullPrompt += `Based on our conversation history above, please respond to the following message. Remember to reference previous context when relevant:\n\n`
    } else {
      fullPrompt += "This appears to be the start of our conversation.\n\n"
    }

    // Add current user query
    fullPrompt += `Human: ${query.trim()}\n\nAssistant:`

    console.log("Full prompt length:", fullPrompt.length)
    console.log("Sending prompt to Gemini AI...")

    // Generate main response
    let text
    try {
      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      text = response.text()
      console.log("AI Response generated successfully")
      console.log("Response preview:", text.substring(0, 200) + "...")
    } catch (error: any) {
      console.error("Error generating content:", error)

      // Handle specific Gemini API errors
      if (error.message?.includes("API_KEY_INVALID")) {
        return NextResponse.json(
          { error: "Invalid Gemini API key. Please check your GEMINI_API_KEY environment variable." },
          { status: 401 },
        )
      } else if (error.message?.includes("QUOTA_EXCEEDED")) {
        return NextResponse.json({ error: "API quota exceeded. Please try again later." }, { status: 429 })
      } else if (error.status === 404) {
        return NextResponse.json(
          { error: "Model not found. The API might be experiencing issues. Please try again later." },
          { status: 500 },
        )
      } else {
        return NextResponse.json(
          { error: `Failed to generate response: ${error.message}. Please try again.` },
          { status: 500 },
        )
      }
    }

    // Generate suggestions based on conversation context
    let suggestions: string[] = []
    try {
      const suggestionPrompt = `Based on our conversation history and the user's latest message "${query.trim()}", provide exactly 3 short follow-up questions (each under 8 words) that would be relevant to continue this conversation. Consider the full context of our discussion. Return only the questions, one per line, without numbers or bullets.`

      const suggestionResult = await model.generateContent(suggestionPrompt)
      const suggestionResponse = await suggestionResult.response
      const suggestionsText = suggestionResponse.text()

      suggestions = suggestionsText
        .split("\n")
        .map((s) =>
          s
            .trim()
            .replace(/^\d+\.\s*/, "")
            .replace(/^-\s*/, "")
            .replace(/^\*\s*/, ""),
        )
        .filter((s) => s.length > 0 && s.length < 50)
        .slice(0, 3)
    } catch (error) {
      console.warn("Failed to generate suggestions:", error)
      suggestions = ["Tell me more about this", "Can you explain further?", "What else should I know?"]
    }

    console.log("Generated suggestions:", suggestions)
    console.log("=== API RESPONSE COMPLETE ===")

    return NextResponse.json({
      response: text,
      suggestions: suggestions,
      memoryUsed: conversationHistory?.length || 0,
    })
  } catch (error: any) {
    console.error("Unexpected error in API route:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Chat API is running",
    method: "Use POST to send messages",
    router: "App Router",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    modelUsed: "gemini-1.5-flash",
    features: ["Enhanced Memory", "Context Awareness", "Conversation History", "Debug Mode"],
  })
}
