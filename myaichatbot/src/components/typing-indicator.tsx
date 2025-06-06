"use client"

export default function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1 p-3 rounded-lg bg-[var(--ai-message-bg)] border border-[var(--border)] shadow-sm max-w-[200px]">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      </div>
      <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
    </div>
  )
}
