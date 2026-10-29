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
import { Switch } from "@/components/ui/switch"
import { convertGhsToRmb, formatAmount } from "@/lib/exchange-math"
import { MIN_GHS_AMOUNT, STANDARD_TIER_MIN_GHS } from "@/lib/trade-policy"

type RateAdminDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRatesSaved?: (standardRate: number, smallRate: number) => void
  /** @deprecated use onRatesSaved */
  onRateSaved?: (storedRate: number) => void
}

function formatRateInput(rate: number): string {
  if (rate === 0) return "0"
  if (rate > 0) return rate.toFixed(2)
  return ""
}

async function loadAdminSettings(
  setStandardRate: (v: string) => void,
  setSmallRate: (v: string) => void,
  setMomoNumber: (v: string) => void,
  setMomoName: (v: string) => void,
  setMoolreEnabled: (v: boolean) => void,
) {
  const [rateRes, paymentRes] = await Promise.all([
    fetch("/api/rate-admin/rate"),
    fetch("/api/rate-admin/payment"),
  ])
  const rateData = await rateRes.json()
  const paymentData = await paymentRes.json()

  if (typeof rateData.rate === "number") {
    setStandardRate(formatRateInput(rateData.rate))
  }
  if (typeof rateData.smallRate === "number") {
    setSmallRate(formatRateInput(rateData.smallRate))
  } else if (typeof rateData.rate === "number") {
    setSmallRate(formatRateInput(rateData.rate))
  }

  if (typeof paymentData.number === "string") {
    setMomoNumber(paymentData.number)
  }
  if (typeof paymentData.name === "string") {
    setMomoName(paymentData.name)
  }
  setMoolreEnabled(paymentData.moolreEnabled === true)
}

export function RateAdminDialog({ open, onOpenChange, onRatesSaved, onRateSaved }: RateAdminDialogProps) {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [standardRate, setStandardRate] = useState("")
  const [smallRate, setSmallRate] = useState("")
  const [momoNumber, setMomoNumber] = useState("")
  const [momoName, setMomoName] = useState("")
  const [moolreEnabled, setMoolreEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const previewStandard = parseFloat(standardRate)
  const previewSmall = parseFloat(smallRate)
  const showPreview =
    Number.isFinite(previewStandard) &&
    previewStandard > 0 &&
    Number.isFinite(previewSmall) &&
    previewSmall > 0

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
      await loadAdminSettings(setStandardRate, setSmallRate, setMomoNumber, setMomoName, setMoolreEnabled)
    } else {
      setError(data.error || "Login failed")
    }
  }

  const handleSave = async () => {
    setError(null)
    const storedStandard = parseFloat(standardRate)
    const storedSmall = parseFloat(smallRate)
    if (!Number.isFinite(storedStandard) || storedStandard < 0) {
      setError("Enter a valid ₵1,000+ rate (e.g. 0.52), or 0 to pause trading")
      return
    }
    if (!Number.isFinite(storedSmall) || storedSmall < 0) {
      setError("Enter a valid small-trade rate (e.g. 0.50), or 0 if both rates are paused")
      return
    }
    if (storedStandard > 0 && storedSmall === 0) {
      setError("Set a small-trade rate for trades under ₵1,000, or pause both rates with 0")
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
          body: JSON.stringify({ rate: storedStandard, smallRate: storedSmall }),
        }),
        fetch("/api/rate-admin/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ number: momoNumber, name: momoName, moolreEnabled }),
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
        const savedSmall = typeof rateData.smallRate === "number" ? rateData.smallRate : rateData.rate
        onRatesSaved?.(rateData.rate, savedSmall)
        onRateSaved?.(rateData.rate)
      }
      if (typeof paymentData.number === "string") {
        setMomoNumber(paymentData.number)
      }
      if (typeof paymentData.name === "string") {
        setMomoName(paymentData.name)
      }
      if (typeof paymentData.moolreEnabled === "boolean") {
        setMoolreEnabled(paymentData.moolreEnabled)
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
      <DialogContent className="mx-4 max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl sm:mx-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>Rate & payment control</DialogTitle>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
              <Lock className="h-3 w-3" aria-hidden />
              Admins only
            </span>
          </div>
          <DialogDescription>
            Homepage shows the ₵{STANDARD_TIER_MIN_GHS.toLocaleString()}+ rate. Smaller trades get a
            lower rate, shown as a short note next to the amount.
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                <Label htmlFor="standard-rate" className="text-emerald-950">
                  Standard rate · ₵{STANDARD_TIER_MIN_GHS.toLocaleString()}+
                </Label>
                <Input
                  id="standard-rate"
                  inputMode="decimal"
                  value={standardRate}
                  onChange={(e) => setStandardRate(e.target.value)}
                  className="input-touch bg-white"
                  placeholder="e.g. 0.52"
                />
                <p className="text-xs text-emerald-900/80">
                  Shown on the homepage. 1 GHS = this many RMB.
                </p>
              </div>
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <Label htmlFor="small-rate" className="text-amber-950">
                  Small-trade rate · ₵{MIN_GHS_AMOUNT}–₵{(STANDARD_TIER_MIN_GHS - 1).toLocaleString()}
                </Label>
                <Input
                  id="small-rate"
                  inputMode="decimal"
                  value={smallRate}
                  onChange={(e) => setSmallRate(e.target.value)}
                  className="input-touch bg-white"
                  placeholder="e.g. 0.50"
                />
                <p className="text-xs text-amber-900/80">
                  Applied when the customer sends under ₵{STANDARD_TIER_MIN_GHS.toLocaleString()}.
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Enter <strong>0</strong> on the standard rate to show “Rate will be posted soon” and
              pause new trades. Minimum customer trade is ₵{MIN_GHS_AMOUNT}.
            </p>

            {showPreview ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
                <ul className="mt-2 space-y-1 text-slate-700">
                  <li>
                    ₵{MIN_GHS_AMOUNT} → ¥{formatAmount(convertGhsToRmb(MIN_GHS_AMOUNT, previewSmall))}{" "}
                    <span className="text-amber-800">(small)</span>
                  </li>
                  <li>
                    ₵{STANDARD_TIER_MIN_GHS.toLocaleString()} → ¥
                    {formatAmount(convertGhsToRmb(STANDARD_TIER_MIN_GHS, previewStandard))}{" "}
                    <span className="text-emerald-800">(standard)</span>
                  </li>
                </ul>
              </div>
            ) : null}

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-900">Mobile money payment</p>
              <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="min-w-0">
                  <Label htmlFor="moolre-toggle" className="text-slate-900">
                    Instant MoMo prompt (Moolre)
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    On: customers approve a prompt. Off: they send to your MoMo number. Moolre fees
                    are added to what the customer pays.
                  </p>
                </div>
                <Switch
                  id="moolre-toggle"
                  checked={moolreEnabled}
                  onCheckedChange={setMoolreEnabled}
                  className="mt-1 data-[state=checked]:bg-emerald-600"
                />
              </div>
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
