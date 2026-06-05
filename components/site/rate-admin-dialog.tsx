"use client"

import { useState } from "react"
import { Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type RateAdminDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Called with stored rate (RMB per 1 GHS) after a successful save. */
  onRateSaved?: (storedRate: number) => void
}

export function RateAdminDialog({ open, onOpenChange, onRateSaved }: RateAdminDialogProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [newRate, setNewRate] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    const res = await fetch("/api/rate-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (data.success) {
      setLoggedIn(true)
      setPassword("")
      const rateRes = await fetch("/api/rate-admin/rate")
      const rateData = await rateRes.json()
      if (typeof rateData.rate === "number") {
        if (rateData.rate === 0) {
          setNewRate("0")
        } else if (rateData.rate > 0) {
          setNewRate(rateData.rate.toFixed(2))
        }
      }
    } else {
      setError(data.error || "Login failed")
    }
  }

  const handleSave = async () => {
    setError(null)
    const storedRate = parseFloat(newRate)
    if (!Number.isFinite(storedRate) || storedRate < 0) {
      setError("Enter a valid number (e.g. 0.52), or 0 to pause trading until the rate is posted")
      return
    }
    const res = await fetch("/api/rate-admin/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ rate: storedRate }),
    })
    const data = await res.json()
    if (data.success && typeof data.rate === "number") {
      onRateSaved?.(data.rate)
      onOpenChange(false)
    } else {
      setError(data.error || "Failed to save")
    }
  }

  const handleLogout = async () => {
    await fetch("/api/rate-admin/logout", { method: "POST" })
    setLoggedIn(false)
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-w-md rounded-2xl sm:mx-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>Rate control</DialogTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
              <Lock className="h-3 w-3" aria-hidden />
              Admins only
            </span>
          </div>
          <DialogDescription>
            Set the live GHS ↔ RMB exchange rate shown on the site. Sign in with your rate portal
            credentials.
          </DialogDescription>
        </DialogHeader>

        {!loggedIn ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-user">Username</Label>
              <Input
                id="admin-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-touch"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Password</Label>
              <Input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-touch"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full min-h-[44px]" onClick={handleLogin}>
              Sign in
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-rate">Homepage rate: 1 GHS = ___ RMB</Label>
              <Input
                id="new-rate"
                inputMode="decimal"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                className="input-touch"
                placeholder="e.g. 0.52"
              />
              <p className="text-xs text-muted-foreground">
                Example: 0.52 means ¥0.52 RMB for every ₵1 GHS. Enter <strong>0</strong> to show
                &quot;Rate will be posted soon&quot; and pause new trades until you set a real rate.
              </p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="min-h-[44px] flex-1" onClick={handleSave}>
                Save rate
              </Button>
              <Button variant="outline" className="min-h-[44px]" onClick={handleLogout}>
                Log out
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
