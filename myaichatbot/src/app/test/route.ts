import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    message: "API routes are working!",
    router: "App Router",
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    return NextResponse.json({
      message: "POST method works!",
      received: body,
      router: "App Router",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}
