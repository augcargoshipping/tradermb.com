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

async function loadAdminSettings(
  setNewRate: (v: string) => void,
  setMomoNumber: (v: string) => void,
  setMomoName: (v: string) => void,
) {
  const [rateRes, paymentRes] = await Promise.all([
    fetch("/api/rate-admin/rate"),
    fetch("/api/rate-admin/payment"),
  ])
  const rateData = await rateRes.json()
  const paymentData = await paymentRes.json()

  if (typeof rateData.rate === "number") {
    if (rateData.rate === 0) {
      setNewRate("0")
    } else if (rateData.rate > 0) {
      setNewRate(rateData.rate.toFixed(2))
    }
  }

  if (typeof paymentData.number === "string") {
    setMomoNumber(paymentData.number)
  }
  if (typeof paymentData.name === "string") {
    setMomoName(paymentData.name)
  }
}

export function RateAdminDialog({ open, onOpenChange, onRateSaved }: RateAdminDialogProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [newRate, setNewRate] = useState("")
  const [momoNumber, setMomoNumber] = useState("")
  const [momoName, setMomoName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
      await loadAdminSettings(setNewRate, setMomoNumber, setMomoName)
    } else {
      setError(data.error || "Login failed")
    }
  }

  const handleSave = async () => {
    setError(null)
    const storedRate = parseFloat(newRate)
    if (!Number.isFinite(storedRate) || storedRate < 0) {
      setError("Enter a valid rate (e.g. 0.52), or 0 to pause trading until the rate is posted")
      return
    }
    if (!momoNumber.trim()) {
      setError("Enter the mobile money number customers should pay to")
      return
    }
    if (!momoName.trim()) {
      setError("Enter the account name shown on the payment screen")
      return
    }

    setSaving(true)
    try {
      const [rateRes, paymentRes] = await Promise.all([
        fetch("/api/rate-admin/rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ rate: storedRate }),
        }),
        fetch("/api/rate-admin/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ number: momoNumber, name: momoName }),
        }),
      ])

      const rateData = await rateRes.json()
      const paymentData = await paymentRes.json()

      if (!rateData.success) {
        setError(rateData.error || "Failed to save rate")
        return
      }
      if (!paymentData.success) {
        setError(paymentData.error || "Failed to save payment details")
        return
      }

      if (typeof rateData.rate === "number") {
        onRateSaved?.(rateData.rate)
      }
      if (typeof paymentData.number === "string") {
        setMomoNumber(paymentData.number)
      }
      if (typeof paymentData.name === "string") {
        setMomoName(paymentData.name)
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/rate-admin/logout", { method: "POST" })
    setLoggedIn(false)
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 max-h-[90vh] max-w-md overflow-y-auto rounded-2xl sm:mx-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>Rate & payment control</DialogTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
              <Lock className="h-3 w-3" aria-hidden />
              Admins only
            </span>
          </div>
          <DialogDescription>
            Set the live exchange rate and mobile money payment details shown to customers after
            they submit a trade.
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
          <div className="space-y-6">
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

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900">Mobile money payment</p>
              <div className="space-y-2">
                <Label htmlFor="momo-number">Payment number</Label>
                <Input
                  id="momo-number"
                  inputMode="tel"
                  value={momoNumber}
                  onChange={(e) => setMomoNumber(e.target.value)}
                  className="input-touch"
                  placeholder="e.g. 0594669717"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="momo-name">Account name</Label>
                <Input
                  id="momo-name"
                  value={momoName}
                  onChange={(e) => setMomoName(e.target.value)}
                  className="input-touch"
                  placeholder="e.g. August Cargo Logistics"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Shown on the confirmation page where customers send their MoMo payment.
              </p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="min-h-[44px] flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
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
