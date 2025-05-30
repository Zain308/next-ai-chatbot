export default function TestEnv() {
  return <div>{process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "No API key found"}</div>;
}