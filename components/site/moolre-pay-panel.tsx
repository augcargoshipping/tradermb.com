"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Smartphone } from "lucide-react"
import { guessMoolreNetwork, type MoolreNetwork } from "@/lib/moolre-networks"
import { formatGhsMoney, moolreCollectionFees } from "@/lib/moolre-fees"

const NETWORKS: { id: MoolreNetwork; label: string }[] = [
  { id: "mtn", label: "MTN" },
  { id: "telecel", label: "Telecel" },
  { id: "at", label: "AT" },
]

type PayState = "idle" | "otp_required" | "prompt_sent" | "paid" | "failed"

export function MoolrePayPanel({
  recordId,
  referenceCode,
  mobileNumber,
  ghsAmount,
  onPaid,
}: {
  recordId?: number
  referenceCode: string
  mobileNumber: string
  ghsAmount: string
  onPaid: () => void
}) {
  const [network, setNetwork] = useState<MoolreNetwork>(() => guessMoolreNetwork(mobileNumber))
  const [state, setState] = useState<PayState>("idle")
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const onPaidRef = useRef(onPaid)
  onPaidRef.current = onPaid
  const tradeGhs = Number.parseFloat(ghsAmount)
  const fees = moolreCollectionFees(Number.isFinite(tradeGhs) ? tradeGhs : 0)

  useEffect(() => {
    if (state !== "prompt_sent" || !recordId) return
    let cancelled = false
    const tick = async () => {
      try {
        const res = await fetch("/api/moolre/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recordId, referenceCode }),
        })
        const data = await res.json()
        if (cancelled) return
        if (data.state === "paid") {
          setState("paid")
          onPaidRef.current()
        } else if (data.state === "failed") {
          setState("failed")
          setError(data.error || "Payment was not completed. You can try again.")
        }
      } catch {
        /* keep polling */
      }
    }
    const id = setInterval(() => void tick(), 4000)
    void tick()
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [state, recordId, referenceCode])

  const collect = async (opts?: { otpcode?: string; retry?: boolean }) => {
    if (!recordId || busy || state === "paid") return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/moolre/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          referenceCode,
          network,
          otpcode: opts?.otpcode,
          retry: opts?.retry === true,
        }),
      })
      const data = await res.json()
      if (data.state === "paid") {
        setState("paid")
        setMessage("Payment received.")
        onPaid()
        return
      }
      if (data.state === "otp_required") {
        setState("otp_required")
        setMessage(data.message || "Enter the OTP sent to your phone.")
        return
      }
      if (data.state === "prompt_sent") {
        setState("prompt_sent")
        setMessage(data.message || "Approve the prompt on your phone.")
        return
      }
      setState("failed")
      setError(data.error || "Could not start payment.")
    } catch {
      setError("Network error. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!recordId) {
    return <p className="text-sm text-red-600">This order is missing an id. Refresh and submit again.</p>
  }

  if (state === "paid") {
    return (
      <div className="rounded-lg border border-emerald-300 bg-white p-4 text-center">
        <p className="text-sm font-semibold text-emerald-800 sm:text-base">Payment received</p>
        <p className="mt-1 text-xs text-emerald-700 sm:text-sm">
          We’ll send your RMB shortly. Keep this page or check your email for updates.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-orange-300 bg-white p-3 sm:p-4">
        <p className="text-sm font-medium text-gray-700">Pay from</p>
        <p className="mt-1 text-xl font-bold text-orange-600 sm:text-2xl">{mobileNumber}</p>
        <p className="mt-1 text-sm text-gray-600">
          Trade: GHS {formatGhsMoney(Number.isFinite(tradeGhs) ? tradeGhs : 0)} · Fee: GHS {formatGhsMoney(fees.fee)}
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          You pay: <span className="text-orange-600">GHS {formatGhsMoney(fees.collect)}</span>
        </p>
        <p className="mt-1 text-xs text-gray-500">MoMo processing fees are paid by you, not taken from your RMB.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Mobile money network</p>
        <div className="grid grid-cols-3 gap-2">
          {NETWORKS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={busy || state === "prompt_sent"}
              onClick={() => setNetwork(item.id)}
              className={`h-11 rounded-lg border text-sm font-semibold ${
                network === item.id
                  ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {state === "otp_required" && (
        <div className="space-y-2">
          <Label htmlFor="moolre-otp">OTP from SMS</Label>
          <Input
            id="moolre-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="Enter OTP"
            className="h-12 text-lg tracking-widest"
          />
          <Button
            type="button"
            disabled={busy || otp.length < 4}
            onClick={() => void collect({ otpcode: otp })}
            className="h-12 w-full rounded-xl bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {busy ? "Checking OTP…" : "Continue"}
          </Button>
        </div>
      )}

      {state !== "otp_required" && (
        <Button
          type="button"
          disabled={busy}
          onClick={() => void collect({ retry: state === "failed" || state === "prompt_sent" })}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-emerald-700 text-base font-bold text-white hover:bg-emerald-800"
        >
          <Smartphone className="mr-2 h-5 w-5" />
          {busy
            ? "Sending prompt…"
            : state === "prompt_sent"
              ? "Send prompt again"
              : state === "failed"
                ? "Try payment again"
                : "Pay with mobile money"}
        </Button>
      )}

      {state === "prompt_sent" && (
        <p className="text-sm font-medium text-emerald-800">
          {message || "Approve the prompt on your phone."} This page will update when payment goes through.
        </p>
      )}
      {state === "otp_required" && message && <p className="text-sm text-emerald-800">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
