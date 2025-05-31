import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  query: string;
}

interface ChatResponse {
  response: string;
  suggestions: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Make Gemini API call
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: query,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    // Extract the response text (adjust based on actual API response structure)
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from API';

    // Generate suggestions (since Gemini API may not provide them)
    const suggestions = [
      `Ask more about ${query.split(' ').slice(0, 2).join(' ')}`,
      `What is related to ${query}?`,
      `Tell me about ${query.split(' ')[0]} in detail`,
      `How does ${query.split(' ')[0]} work?`,
    ].slice(0, 3); // Limit to 3-5 suggestions

    const chatResponse: ChatResponse = {
      response: answer,
      suggestions,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}