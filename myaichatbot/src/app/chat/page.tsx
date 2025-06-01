"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Send, LogOut, Bot, User, Copy } from "lucide-react";
import DarkModeToggle from "@/components/dark-mode-toggle";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: text,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError("");
    setSuggestions([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(error.message || "Failed to get response");

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent border-[var(--accent)] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background shadow">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center gradient-accent">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
            <p className="text-xs text-muted-foreground">Powered by Gemini AI • Online</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
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
                I’m here to assist you with information, creative tasks, or just a friendly chat. What’s on your mind?
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                {["Tell me a joke", "Explain quantum physics", "Write a poem", "Help me code"].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="btn-starter hover-scale"
                  >
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
                className={`group max-w-[80%] sm:max-w-[70%] ${message.sender === "user" ? "order-1" : ""}`}
                style={{
                  background: message.sender === "user" ? "var(--user-message-bg)" : "var(--ai-message-bg)",
                  color: message.sender === "user" ? "var(--user-message-text)" : "var(--ai-message-text)",
                  padding: "1rem",
                  borderRadius: "1rem",
                  boxShadow: "var(--shadow)",
                  border: message.sender === "ai" ? `1px solid var(--border)` : "none",
                }}
              >
                <p className="message-content text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
                className="p-4 rounded-2xl"
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
              disabled={isTyping}
              className="flex-1"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              className="btn-primary"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}