"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
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
  const [formError, setFormError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    try {
      const res = await signIn("credentials", {
        identifier,
        password,
        redirect: false,
      });
      if (res?.ok) {
        // Full page load picks up the session cookie reliably (client router can miss it)
        window.location.assign("/dashboard");
        return;
      }
      const message =
        res?.error === "CredentialsSignin"
          ? "Email or password incorrect"
          : res?.error ?? "Sign in failed. Please try again.";
      setFormError(message);
    } catch {
      setFormError("Sign in failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell hero-gradient flex items-center justify-center py-8 px-4">
      <div className="glass-card flex w-full max-w-md flex-col items-center p-6 sm:p-8">
        <div className="flex flex-col items-center mb-4">
          <img src="/logo-nav.png?v=3" alt="TRADE RMB Logo" className="w-12 h-12 object-contain mb-2" />
          <span className="text-2xl font-extrabold text-emerald-800 tracking-tight mb-2">TRADE RMB</span>
        </div>
        <h2 className="text-2xl font-bold text-emerald-800 mb-1 text-center">Welcome Back</h2>
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
                className="input-touch w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              className="input-touch pl-10 pr-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="button" className="absolute right-3 top-3" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="flex justify-end">
            <a href="/auth/forgot-password" className="text-emerald-700 text-sm hover:underline">Forgot password?</a>
          </div>
          <button
            type="submit"
            className="btn-primary w-full text-lg disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          {(formError || error) && (
            <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3">
              {formError ??
                (error === "CredentialsSignin"
                  ? "Email or password incorrect"
                  : decodeURIComponent(error))}
            </div>
          )}
        </form>
        <p className="mt-6 text-sm text-gray-600">
          Don&apos;t have an account? <a href="/auth/signup" className="text-emerald-700 underline">Create one here</a>
        </p>
        <a href="/" className="mt-2 text-gray-400 text-xs hover:underline">&larr; Back to Home</a>
      </div>
    </div>
  );
} 