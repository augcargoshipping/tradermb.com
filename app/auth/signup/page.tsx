"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, User, Mail, Phone, Lock } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [referralName, setReferralName] = useState("");
  const [referralLocked, setReferralLocked] = useState(false);
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    const referrer = searchParams.get("referrer");
    if (referrer) {
      setReferralName(referrer);
      setReferralLocked(true);
    }
  }, [searchParams]);

  if (status === "loading") return null;
  if (session && session.user) {
    if (typeof window !== "undefined") {
      window.location.replace("/dashboard");
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, username, email, phone, password, referralName }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push("/auth/signin");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Registration failed");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-purple-600 py-8 px-2">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/logo.png" alt="TRADE RMB Logo" className="w-12 h-12 object-contain mb-2" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight mb-2">TRADE RMB</span>
        </div>
        <h2 className="text-2xl font-bold text-purple-700 mb-1 text-center">Create Account</h2>
        <p className="text-gray-500 mb-6 text-center">Join us to start trading RMB</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="pl-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Referral Name (if any)"
              value={referralName}
              onChange={e => setReferralName(e.target.value)}
              disabled={referralLocked}
              className={`pl-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 ${referralLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="pl-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="pl-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              className="pl-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="pl-10 pr-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button type="button" className="absolute right-3 top-3" tabIndex={-1} onClick={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="pl-10 pr-10 border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button type="button" className="absolute right-3 top-3" tabIndex={-1} onClick={() => setShowConfirmPassword(v => !v)}>
              {showConfirmPassword ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 font-bold text-lg shadow hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
        </form>
        <p className="mt-6 text-sm text-gray-600">
          Already have an account? <a href="/auth/signin" className="text-blue-600 underline">Sign in here</a>
        </p>
        <a href="/" className="mt-2 text-gray-400 text-xs hover:underline">&larr; Back to Home</a>
      </div>
    </div>
  );
} 