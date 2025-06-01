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

    const { query } = body

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Valid query is required" }, { status: 400 })
    }

    console.log("Processing query:", query)

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Generate main response
    let text
    try {
      const result = await model.generateContent(query.trim())
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
      } else {
        return NextResponse.json({ error: "Failed to generate response. Please try again." }, { status: 500 })
      }
    }

    // Generate suggestions
    let suggestions: string[] = []
    try {
      const suggestionPrompt = `Based on the query "${query.trim()}", provide exactly 3 short follow-up questions (each under 8 words). Return only the questions, one per line, without numbers or bullets.`

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
  })
}
