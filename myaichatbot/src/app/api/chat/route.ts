import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(req: NextRequest) {
  try {
    console.log("API route called")

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

    const { query, context, userId, sessionId, conversationHistory } = body

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Valid query is required" }, { status: 400 })
    }

    console.log("Processing query:", query)
    console.log("Context provided:", !!context)
    console.log("Conversation history length:", conversationHistory?.length || 0)

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Build comprehensive prompt with memory and conversation history
    let fullPrompt = ""

    // System instructions for memory and continuity
    const systemInstruction = `You are an AI assistant with excellent memory capabilities. You remember previous conversations, user preferences, and personal details shared with you.

IMPORTANT MEMORY RULES:
1. Always remember the user's name when they tell you
2. Reference previous conversations naturally
3. Maintain consistency with past interactions
4. Build upon topics discussed before
5. Remember user preferences and adapt accordingly
6. If you remember something about the user, mention it naturally

When a user tells you their name, always acknowledge it and use it in future responses.`

    fullPrompt += systemInstruction + "\n\n"

    // Add memory context if available
    if (context && context.trim()) {
      fullPrompt += context + "\n\n"
    }

    // Add recent conversation history for immediate context
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      fullPrompt += "--- RECENT CONVERSATION ---\n"
      conversationHistory.forEach((msg: any) => {
        fullPrompt += `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}\n`
      })
      fullPrompt += "--- END RECENT CONVERSATION ---\n\n"
    }

    // Add current user query
    fullPrompt += `User: ${query.trim()}\n\nAssistant:`

    console.log("Full prompt length:", fullPrompt.length)

    // Generate main response
    let text
    try {
      const result = await model.generateContent(fullPrompt)
      const response = await result.response
      text = response.text()
      console.log("Generated response:", text.substring(0, 100) + "...")
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

    // Generate suggestions with context awareness
    let suggestions: string[] = []
    try {
      const suggestionPrompt = `Based on the conversation and the user's query "${query.trim()}", provide exactly 3 short follow-up questions (each under 8 words) that would be relevant to continue this conversation. Consider any personal information shared (like names) and conversation history. Return only the questions, one per line, without numbers or bullets.`

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

    console.log("Returning response with suggestions:", suggestions)

    return NextResponse.json({
      response: text,
      suggestions: suggestions,
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
    features: ["Memory", "Context Awareness", "Personalization"],
  })
}
