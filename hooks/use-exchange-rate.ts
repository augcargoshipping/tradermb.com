"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RATE_PENDING_MESSAGE } from "@/lib/exchange-rate"

/** Stored in DB: RMB received per 1 GHS paid. */
export type StoredExchangeRate = number

export type RateDisplayStatus = "active" | "pending" | "loading"

type FetchRatePayload = {
  success?: boolean
  status?: "active" | "pending"
  rate?: number
  ghsPerRmb?: number | null
  tradingEnabled?: boolean
  message?: string | null
}

type RateState = {
  rate: number | null
  ghsPerRmb: number | null
  status: RateDisplayStatus
  tradingEnabled: boolean
  pendingMessage: string
  loading: boolean
  refresh: () => Promise<void>
  applyRate: (storedRate: StoredExchangeRate) => void
}

const FETCH_TIMEOUT_MS = 12_000

function applyPayload(
  data: FetchRatePayload,
  setters: {
    setRate: (v: number | null) => void
    setGhsPerRmb: (v: number | null) => void
    setStatus: (v: RateDisplayStatus) => void
    setTradingEnabled: (v: boolean) => void
    setPendingMessage: (v: string) => void
    setLoading: (v: boolean) => void
  }
) {
  if (data.success && data.status === "pending") {
    setters.setRate(0)
    setters.setGhsPerRmb(null)
    setters.setStatus("pending")
    setters.setTradingEnabled(false)
    setters.setPendingMessage(data.message || RATE_PENDING_MESSAGE)
    setters.setLoading(false)
    return
  }

  if (
    data.success &&
    data.status === "active" &&
    typeof data.rate === "number" &&
    data.rate > 0
  ) {
    setters.setRate(data.rate)
    setters.setGhsPerRmb(
      typeof data.ghsPerRmb === "number" && data.ghsPerRmb > 0
        ? data.ghsPerRmb
        : 1 / data.rate
    )
    setters.setStatus("active")
    setters.setTradingEnabled(true)
    setters.setPendingMessage(RATE_PENDING_MESSAGE)
    setters.setLoading(false)
    return
  }

  setters.setLoading(false)
}

export function useExchangeRate(pollMs = 60_000): RateState {
  const [rate, setRate] = useState<number | null>(null)
  const [ghsPerRmb, setGhsPerRmb] = useState<number | null>(null)
  const [status, setStatus] = useState<RateDisplayStatus>("loading")
  const [tradingEnabled, setTradingEnabled] = useState(false)
  const [pendingMessage, setPendingMessage] = useState(RATE_PENDING_MESSAGE)
  const [loading, setLoading] = useState(true)
  const hasLoadedOnce = useRef(false)

  const setters = {
    setRate,
    setGhsPerRmb,
    setStatus,
    setTradingEnabled,
    setPendingMessage,
    setLoading,
  }

  const applyRate = useCallback((storedRate: StoredExchangeRate) => {
    if (storedRate === 0) {
      setRate(0)
      setGhsPerRmb(null)
      setStatus("pending")
      setTradingEnabled(false)
      setPendingMessage(RATE_PENDING_MESSAGE)
      setLoading(false)
      hasLoadedOnce.current = true
      return
    }
    if (!Number.isFinite(storedRate) || storedRate <= 0) return
    setRate(storedRate)
    setGhsPerRmb(1 / storedRate)
    setStatus("active")
    setTradingEnabled(true)
    setLoading(false)
    hasLoadedOnce.current = true
  }, [])

  const load = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const showSpinner = !hasLoadedOnce.current

    try {
      if (showSpinner) setLoading(true)

      const res = await fetch(`/api/fetch-rate?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const data = (await res.json()) as FetchRatePayload

      if (data.success) {
        applyPayload(data, setters)
        hasLoadedOnce.current = true
      } else if (!hasLoadedOnce.current) {
        setStatus("pending")
        setTradingEnabled(false)
        setPendingMessage(RATE_PENDING_MESSAGE)
        setLoading(false)
      }
    } catch {
      if (!hasLoadedOnce.current) {
        setStatus("pending")
        setTradingEnabled(false)
        setPendingMessage(RATE_PENDING_MESSAGE)
        setLoading(false)
      }
    } finally {
      clearTimeout(timeoutId)
      if (hasLoadedOnce.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, pollMs)
    return () => clearInterval(id)
  }, [load, pollMs])

  return {
    rate,
    ghsPerRmb,
    status,
    tradingEnabled,
    pendingMessage,
    loading,
    refresh: load,
    applyRate,
  }
}
