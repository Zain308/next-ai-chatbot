"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import DarkModeToggle from "@/components/dark-mode-toggle";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null); // Track user state
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        router.push("/chat");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/chat");
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setLoading(false);

      if (error.code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized for Google Sign-In. Please contact the administrator or try from an authorized domain.",
        );
      } else if (error.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (error.code === "auth/popup-blocked") {
        setError("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
      } else if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Failed to sign in. Please try again later.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Failed to sign out. Please try again.");
    }
  };

  const getCurrentDomain = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "your-domain";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <header className="absolute top-4 right-4 flex gap-2">
        {user && (
          <button
            onClick={handleLogout}
            className="p-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
            aria-label="Sign out"
          >
            Sign Out
          </button>
        )}
        <DarkModeToggle />
      </header>
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          AI Chatbot Login
        </h1>

        {error && (
          <div
            role="alert"
            className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          >
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            {error.includes("unauthorized-domain") && (
              <div className="mt-3 text-xs text-red-600 dark:text-red-400">
                <p className="font-semibold">To fix this:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Go to Firebase Console → Authentication → Settings</li>
                  <li>
                    Add this domain to authorized domains:{" "}
                    <code className="bg-red-100 dark:bg-red-800 px-1 rounded">{getCurrentDomain()}</code>
                  </li>
                  <li>Save and try again</li>
                </ol>
              </div>
            )}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          aria-label="Sign in with Google"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Signing in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Secure authentication powered by Firebase
          </p>
        </div>
      </div>
    </div>
  );
}