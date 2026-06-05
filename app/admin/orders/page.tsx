"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, QrCode, Banknote, XCircle, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type OrderRow = {
  id: number
  customer_name: string
  email_address: string
  mobile_number: string
  referral_name: string | null
  ghs_amount: number
  rmb_amount: number
  reference_code: string
  status: string
  submitted_at: string
  qr_image_data_uri: string | null
  has_qr: boolean
}

const STATUS_ACTIONS = ["Paid", "Cancelled", "Pending", "Completed"] as const

export default function AdminOrdersPage() {
  const [key, setKey] = useState("")
  const [savedKey, setSavedKey] = useState("")
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const load = useCallback(async (adminKey: string) => {
    const trimmedKey = adminKey.trim()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/orders", {
        headers: { "x-admin-key": trimmedKey },
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          try {
            sessionStorage.removeItem("tradeRmbAdminOrdersKey")
          } catch {
            /* ignore */
          }
          setSavedKey("")
          setOrders([])
          setError(
            [data.error, data.hint].filter(Boolean).join(" — ") ||
              "Unauthorized — check ADMIN_ORDERS_KEY in .env.local and restart the server."
          )
          return
        }
        setError([data.error, data.details].filter(Boolean).join(" — ") || "Could not load orders")
        setOrders([])
        return
      }
      setError(null)
      setOrders(data.orders || [])
    } catch {
      setError("Network error")
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("tradeRmbAdminOrdersKey")
      if (stored && stored.trim().length >= 8) {
        const t = stored.trim()
        setSavedKey(t)
        void load(t)
      }
    } catch {
      /* ignore */
    }
  }, [load])

  const handleUnlock = () => {
    const trimmed = key.trim()
    if (trimmed.length < 8) {
      setError("Key is too short (set ADMIN_ORDERS_KEY in .env — at least 8 characters).")
      return
    }
    setSavedKey(trimmed)
    try {
      sessionStorage.setItem("tradeRmbAdminOrdersKey", trimmed)
    } catch {
      /* ignore */
    }
    void load(trimmed)
  }

  const setStatus = async (id: number, status: (typeof STATUS_ACTIONS)[number]) => {
    setUpdatingId(id)
    setError(null)
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "x-admin-key": savedKey.trim(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          try {
            sessionStorage.removeItem("tradeRmbAdminOrdersKey")
          } catch {
            /* ignore */
          }
          setSavedKey("")
          setError([data.error, data.hint].filter(Boolean).join(" — ") || "Unauthorized")
          return
        }
        setError(data.error || "Update failed")
        return
      }
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: data.status } : o))
      )
    } catch {
      setError("Network error")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 p-4 pb-12">
      <div className="max-w-lg mx-auto space-y-6">
        <header className="text-center pt-4">
          <h1 className="text-xl font-bold tracking-tight">Ops — orders &amp; QR</h1>
          <p className="text-sm text-slate-400 mt-1">
            QR images are stored in Turso. Mark Paid when you have sent RMB, or Cancelled if you reject the order.
          </p>
        </header>

        {!savedKey ? (
          <div className="rounded-2xl bg-slate-800/80 border border-slate-600 p-5 space-y-4">
            <Label htmlFor="admin-key" className="text-slate-200">
              Admin key
            </Label>
            <Input
              id="admin-key"
              type="password"
              autoComplete="off"
              placeholder="Same value as ADMIN_ORDERS_KEY"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-slate-900 border-slate-600 text-white"
            />
            <Button className="w-full" onClick={handleUnlock} disabled={loading}>
              Unlock
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <p className="text-xs text-slate-500 leading-relaxed">
              Set <code className="text-slate-300">ADMIN_ORDERS_KEY</code> in <code className="text-slate-300">.env.local</code> (8+ characters), restart the server, then enter it here.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => void load(savedKey.trim())}
                disabled={loading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="border-slate-500 text-slate-200"
                onClick={() => {
                  setSavedKey("")
                  setOrders([])
                  setKey("")
                  try {
                    sessionStorage.removeItem("tradeRmbAdminOrdersKey")
                  } catch {
                    /* ignore */
                  }
                }}
              >
                Lock
              </Button>
            </div>
            {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            <div className="space-y-4">
              {!error && orders.length === 0 && !loading ? (
                <p className="text-center text-slate-400 text-sm">No orders yet.</p>
              ) : !error && orders.length > 0 ? (
                orders.map((o) => (
                  <article
                    key={o.id}
                    className="rounded-2xl bg-slate-800/90 border border-slate-600 overflow-hidden"
                  >
                    <div className="p-4 space-y-2 text-sm border-b border-slate-600/80">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Ref</span>
                        <span className="font-mono font-semibold text-white">{o.reference_code}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Customer</span>
                        <span className="text-right truncate max-w-[60%]">{o.customer_name}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Phone</span>
                        <a href={`tel:${o.mobile_number}`} className="text-blue-400 font-medium">
                          {o.mobile_number}
                        </a>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Amount</span>
                        <span>
                          ₵{o.ghs_amount} · ¥{o.rmb_amount}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-slate-400">Status</span>
                        <span
                          className={cn(
                            "font-semibold px-2 py-0.5 rounded-md text-xs",
                            o.status === "Paid" && "bg-blue-900/80 text-blue-200",
                            o.status === "Completed" && "bg-green-900/80 text-green-200",
                            o.status === "Cancelled" && "bg-red-900/70 text-red-200",
                            o.status === "Pending" && "bg-amber-900/60 text-amber-200"
                          )}
                        >
                          {o.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {STATUS_ACTIONS.map((st) => (
                          <Button
                            key={st}
                            type="button"
                            size="sm"
                            variant={o.status === st ? "default" : "secondary"}
                            disabled={updatingId === o.id || o.status === st}
                            className={cn(
                              "text-xs",
                              st === "Paid" && "bg-emerald-700 hover:bg-emerald-600",
                              st === "Cancelled" && "bg-red-800 hover:bg-red-700",
                              st === "Pending" && "bg-slate-600",
                              st === "Completed" && "bg-green-800 hover:bg-green-700"
                            )}
                            onClick={() => void setStatus(o.id, st)}
                          >
                            {st === "Paid" && <Banknote className="h-3.5 w-3.5 mr-1" />}
                            {st === "Cancelled" && <XCircle className="h-3.5 w-3.5 mr-1" />}
                            {st === "Pending" && <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                            {st}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900/50">
                      {o.has_qr && o.qr_image_data_uri ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="rounded-xl bg-white p-2 shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={o.qr_image_data_uri}
                              alt=""
                              className="w-44 h-44 object-contain"
                            />
                          </div>
                          <span className="text-xs text-slate-400 text-center">
                            Image bytes live in Turso (<code className="text-slate-300">qr_image</code> BLOB)
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 py-4">
                          <QrCode className="h-10 w-10 opacity-50" />
                          <span className="text-xs">No QR for this order</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : loading && !error ? (
                <p className="text-center text-slate-400 text-sm">Loading orders…</p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
