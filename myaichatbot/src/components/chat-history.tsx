"use client"

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, MessageSquare } from "lucide-react"

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
  messageCount: number
}

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string
}

export default function ChatHistory({ onSelectSession, currentSessionId }: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      if (user) {
        loadChatHistory(user.uid)
      }
    })
    return () => unsubscribe()
  }, [])

  const loadChatHistory = (userId: string) => {
    // Load from localStorage for now - you can replace with Firebase Firestore later
    const savedSessions = localStorage.getItem(`chat_history_${userId}`)
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        timestamp: new Date(session.timestamp),
      }))
      setSessions(parsed)
    }
  }

  const deleteSession = (sessionId: string) => {
    if (!user) return

    const updatedSessions = sessions.filter((session) => session.id !== sessionId)
    setSessions(updatedSessions)
    localStorage.setItem(`chat_history_${user.uid}`, JSON.stringify(updatedSessions))

    // Clear messages for this session
    localStorage.removeItem(`chat_messages_${sessionId}`)
  }

  const createNewSession = () => {
    const newSessionId = Date.now().toString()
    onSelectSession(newSessionId)
  }

  return (
    <Card className="w-80 h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Chat History</span>
          <Button size="sm" onClick={createNewSession}>
            <MessageSquare className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No chat history yet. Start a conversation!</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors ${
                currentSessionId === session.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelectSession(session.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{session.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{session.lastMessage}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {session.timestamp.toLocaleDateString()} • {session.messageCount} messages
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="ml-2 h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
