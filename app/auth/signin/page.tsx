"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, User, Lock } from "lucide-react";

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else if (res?.error) {
      router.push(`/auth/signin?error=${encodeURIComponent(res.error)}`);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-purple-600 py-8 px-2">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/logo.png" alt="TRADE RMB Logo" className="w-12 h-12 object-contain mb-2" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight mb-2">TRADE RMB</span>
        </div>
        <h2 className="text-2xl font-bold text-purple-700 mb-1 text-center">Welcome Back</h2>
        <p className="text-gray-500 mb-6 text-center">Sign in to your account to continue</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <div className="mb-4">
            <label htmlFor="identifier" className="block text-gray-700 font-semibold mb-1">Email or Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-5 h-5" />
              </span>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email or username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="pl-10 pr-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button type="button" className="absolute right-3 top-3" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="flex justify-end">
            <a href="/auth/forgot-password" className="text-blue-600 text-sm hover:underline">Forgot password?</a>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 font-bold text-lg shadow hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
              {error === "CredentialsSignin" ? "Email or password incorrect" : decodeURIComponent(error)}
            </div>
          )}
        </form>
        <p className="mt-6 text-sm text-gray-600">
          Don&apos;t have an account? <a href="/auth/signup" className="text-blue-600 underline">Create one here</a>
        </p>
        <a href="/" className="mt-2 text-gray-400 text-xs hover:underline">&larr; Back to Home</a>
      </div>
    </div>
  );
} 