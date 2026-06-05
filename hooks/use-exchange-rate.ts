"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RATE_PENDING_MESSAGE } from "@/lib/exchange-rate"
import {
  cachedRateToState,
  readCachedExchangeRate,
  writeCachedExchangeRate,
  type CachedExchangeRate,
} from "@/lib/rate-cache"

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

const FETCH_TIMEOUT_MS = 25_000
const RETRY_DELAY_MS = 2_000
const MAX_RETRIES = 4

function payloadToCache(data: FetchRatePayload): CachedExchangeRate | null {
  if (!data.success) return null

  if (data.status === "pending") {
    return {
      rate: 0,
      ghsPerRmb: null,
      status: "pending",
      tradingEnabled: false,
      pendingMessage: data.message || RATE_PENDING_MESSAGE,
    }
  }

  if (
    data.status === "active" &&
    typeof data.rate === "number" &&
    data.rate > 0
  ) {
    return {
      rate: data.rate,
      ghsPerRmb:
        typeof data.ghsPerRmb === "number" && data.ghsPerRmb > 0
          ? data.ghsPerRmb
          : 1 / data.rate,
      status: "active",
      tradingEnabled: true,
      pendingMessage: RATE_PENDING_MESSAGE,
    }
  }

  return null
}

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
): boolean {
  const cached = payloadToCache(data)
  if (!cached) {
    return false
  }

  writeCachedExchangeRate(cached)

  if (cached.status === "pending") {
    setters.setRate(0)
    setters.setGhsPerRmb(null)
    setters.setStatus("pending")
    setters.setTradingEnabled(false)
    setters.setPendingMessage(cached.pendingMessage)
    setters.setLoading(false)
    return true
  }

  setters.setRate(cached.rate)
  setters.setGhsPerRmb(cached.ghsPerRmb)
  setters.setStatus("active")
  setters.setTradingEnabled(true)
  setters.setPendingMessage(cached.pendingMessage)
  setters.setLoading(false)
  return true
}

function getInitialState() {
  const cached = readCachedExchangeRate()
  if (cached) {
    const state = cachedRateToState(cached)
    return { ...state, fromCache: true as const }
  }
  return {
    rate: null as number | null,
    ghsPerRmb: null as number | null,
    status: "loading" as RateDisplayStatus,
    tradingEnabled: false,
    pendingMessage: RATE_PENDING_MESSAGE,
    loading: true,
    fromCache: false as const,
  }
}

export function useExchangeRate(pollMs = 60_000): RateState {
  const initial = getInitialState()
  const [rate, setRate] = useState<number | null>(initial.rate)
  const [ghsPerRmb, setGhsPerRmb] = useState<number | null>(initial.ghsPerRmb)
  const [status, setStatus] = useState<RateDisplayStatus>(initial.status)
  const [tradingEnabled, setTradingEnabled] = useState(initial.tradingEnabled)
  const [pendingMessage, setPendingMessage] = useState(initial.pendingMessage)
  const [loading, setLoading] = useState(initial.loading)
  const hasLoadedOnce = useRef(initial.fromCache)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      const cached: CachedExchangeRate = {
        rate: 0,
        ghsPerRmb: null,
        status: "pending",
        tradingEnabled: false,
        pendingMessage: RATE_PENDING_MESSAGE,
      }
      writeCachedExchangeRate(cached)
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

    const cached: CachedExchangeRate = {
      rate: storedRate,
      ghsPerRmb: 1 / storedRate,
      status: "active",
      tradingEnabled: true,
      pendingMessage: RATE_PENDING_MESSAGE,
    }
    writeCachedExchangeRate(cached)
    setRate(storedRate)
    setGhsPerRmb(1 / storedRate)
    setStatus("active")
    setTradingEnabled(true)
    setLoading(false)
    hasLoadedOnce.current = true
  }, [])

  const load = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? hasLoadedOnce.current
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
      if (!background) setLoading(true)

      const res = await fetch(`/api/fetch-rate?t=${Date.now()}`, {
        cache: "no-store",
        signal: controller.signal,
      })
      const data = (await res.json()) as FetchRatePayload

      if (applyPayload(data, setters)) {
        hasLoadedOnce.current = true
        retryCount.current = 0
        return
      }

      throw new Error("Rate response was not usable")
    } catch {
      const cached = readCachedExchangeRate()
      if (cached) {
        const state = cachedRateToState(cached)
        setRate(state.rate)
        setGhsPerRmb(state.ghsPerRmb)
        setStatus(state.status)
        setTradingEnabled(state.tradingEnabled)
        setPendingMessage(state.pendingMessage)
        setLoading(false)
        hasLoadedOnce.current = true

        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1
          retryTimer.current = setTimeout(() => {
            void load({ background: true })
          }, RETRY_DELAY_MS)
        }
        return
      }

      if (retryCount.current < MAX_RETRIES) {
        retryCount.current += 1
        setStatus("loading")
        setLoading(true)
        retryTimer.current = setTimeout(() => {
          void load({ background: false })
        }, RETRY_DELAY_MS)
        return
      }

      setStatus("pending")
      setTradingEnabled(false)
      setPendingMessage(RATE_PENDING_MESSAGE)
      setLoading(false)
    } finally {
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    void load({ background: initial.fromCache })
    const id = setInterval(() => {
      void load({ background: true })
    }, pollMs)
    return () => {
      clearInterval(id)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [load, pollMs, initial.fromCache])

  return {
    rate,
    ghsPerRmb,
    status,
    tradingEnabled,
    pendingMessage,
    loading,
    refresh: () => load({ background: false }),
    applyRate,
  }
}
