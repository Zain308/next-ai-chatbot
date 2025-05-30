'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { TypeAnimation } from 'react-type-animation';

export default function Chat() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const router = useRouter();

  // Protect the route: redirect to login if not authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/'); // Redirect to login page
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Handle query submission (placeholder for Gemini API call)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder: Simulate API response
    setResponse('This is a placeholder response.');
    setSuggestions([
      'Ask about another capital city',
      'Tell me about AI chatbots',
      'What is Next.js?',
    ]);
    setQuery('');
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    // Simulate submitting the suggestion (later integrate with API)
    setResponse(`You clicked: ${suggestion}`);
    setSuggestions([]);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          AI Chatbot
        </h1>
        {/* Chat response area */}
        <div className="min-h-[200px] bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-4">
          {response ? (
            <TypeAnimation
              sequence={[response, 1000]}
              wrapper="p"
              speed={50}
              className="text-gray-900 dark:text-white"
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Ask me anything!</p>
          )}
        </div>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="bg-blue-600 text-white py-1 px-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!query}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}