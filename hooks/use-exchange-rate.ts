"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { RATE_PENDING_MESSAGE } from "@/lib/exchange-rate"
import {
  cachedRateToState,
  readCachedExchangeRate,
  writeCachedExchangeRate,
  type CachedExchangeRate,
} from "@/lib/rate-cache"
import { MIN_GHS_AMOUNT, STANDARD_TIER_MIN_GHS } from "@/lib/trade-policy"

/** Stored in DB: RMB received per 1 GHS paid. */
export type StoredExchangeRate = number

export type RateDisplayStatus = "active" | "pending" | "loading"

type FetchRatePayload = {
  success?: boolean
  status?: "active" | "pending"
  rate?: number
  smallRate?: number
  ghsPerRmb?: number | null
  tradingEnabled?: boolean
  message?: string | null
  minGhs?: number
  standardFromGhs?: number
}

type RateState = {
  rate: number | null
  smallRate: number | null
  ghsPerRmb: number | null
  status: RateDisplayStatus
  tradingEnabled: boolean
  pendingMessage: string
  loading: boolean
  minGhs: number
  standardFromGhs: number
  refresh: () => Promise<void>
  applyRates: (standardRate: StoredExchangeRate, smallRate: StoredExchangeRate) => void
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
      smallRate: 0,
      ghsPerRmb: null,
      status: "pending",
      tradingEnabled: false,
      pendingMessage: data.message || RATE_PENDING_MESSAGE,
      minGhs: data.minGhs || MIN_GHS_AMOUNT,
      standardFromGhs: data.standardFromGhs || STANDARD_TIER_MIN_GHS,
    }
  }

  if (
    data.status === "active" &&
    typeof data.rate === "number" &&
    data.rate > 0
  ) {
    const small = typeof data.smallRate === "number" && data.smallRate > 0 ? data.smallRate : data.rate
    return {
      rate: data.rate,
      smallRate: small,
      ghsPerRmb:
        typeof data.ghsPerRmb === "number" && data.ghsPerRmb > 0
          ? data.ghsPerRmb
          : 1 / data.rate,
      status: "active",
      tradingEnabled: true,
      pendingMessage: RATE_PENDING_MESSAGE,
      minGhs: data.minGhs || MIN_GHS_AMOUNT,
      standardFromGhs: data.standardFromGhs || STANDARD_TIER_MIN_GHS,
    }
  }

  return null
}

type Setters = {
  setRate: (v: number | null) => void
  setSmallRate: (v: number | null) => void
  setGhsPerRmb: (v: number | null) => void
  setStatus: (v: RateDisplayStatus) => void
  setTradingEnabled: (v: boolean) => void
  setPendingMessage: (v: string) => void
  setLoading: (v: boolean) => void
  setMinGhs: (v: number) => void
  setStandardFromGhs: (v: number) => void
}

function applyPayload(data: FetchRatePayload, setters: Setters): boolean {
  const cached = payloadToCache(data)
  if (!cached) {
    return false
  }

  writeCachedExchangeRate(cached)

  if (cached.status === "pending") {
    setters.setRate(0)
    setters.setSmallRate(0)
    setters.setGhsPerRmb(null)
    setters.setStatus("pending")
    setters.setTradingEnabled(false)
    setters.setPendingMessage(cached.pendingMessage)
    setters.setLoading(false)
    setters.setMinGhs(cached.minGhs)
    setters.setStandardFromGhs(cached.standardFromGhs)
    return true
  }

  setters.setRate(cached.rate)
  setters.setSmallRate(cached.smallRate)
  setters.setGhsPerRmb(cached.ghsPerRmb)
  setters.setStatus("active")
  setters.setTradingEnabled(true)
  setters.setPendingMessage(cached.pendingMessage)
  setters.setLoading(false)
  setters.setMinGhs(cached.minGhs)
  setters.setStandardFromGhs(cached.standardFromGhs)
  return true
}

export function useExchangeRate(pollMs = 60_000): RateState {
  const [rate, setRate] = useState<number | null>(null)
  const [smallRate, setSmallRate] = useState<number | null>(null)
  const [ghsPerRmb, setGhsPerRmb] = useState<number | null>(null)
  const [status, setStatus] = useState<RateDisplayStatus>("loading")
  const [tradingEnabled, setTradingEnabled] = useState(false)
  const [pendingMessage, setPendingMessage] = useState(RATE_PENDING_MESSAGE)
  const [loading, setLoading] = useState(true)
  const [minGhs, setMinGhs] = useState(MIN_GHS_AMOUNT)
  const [standardFromGhs, setStandardFromGhs] = useState(STANDARD_TIER_MIN_GHS)
  const hasLoadedOnce = useRef(false)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setters: Setters = {
    setRate,
    setSmallRate,
    setGhsPerRmb,
    setStatus,
    setTradingEnabled,
    setPendingMessage,
    setLoading,
    setMinGhs,
    setStandardFromGhs,
  }

  const applyRates = useCallback((standardRate: StoredExchangeRate, nextSmallRate: StoredExchangeRate) => {
    if (standardRate === 0) {
      const cached: CachedExchangeRate = {
        rate: 0,
        smallRate: 0,
        ghsPerRmb: null,
        status: "pending",
        tradingEnabled: false,
        pendingMessage: RATE_PENDING_MESSAGE,
        minGhs: MIN_GHS_AMOUNT,
        standardFromGhs: STANDARD_TIER_MIN_GHS,
      }
      writeCachedExchangeRate(cached)
      setRate(0)
      setSmallRate(0)
      setGhsPerRmb(null)
      setStatus("pending")
      setTradingEnabled(false)
      setPendingMessage(RATE_PENDING_MESSAGE)
      setLoading(false)
      hasLoadedOnce.current = true
      return
    }
    if (!Number.isFinite(standardRate) || standardRate <= 0) return
    const small = Number.isFinite(nextSmallRate) && nextSmallRate > 0 ? nextSmallRate : standardRate

    const cached: CachedExchangeRate = {
      rate: standardRate,
      smallRate: small,
      ghsPerRmb: 1 / standardRate,
      status: "active",
      tradingEnabled: true,
      pendingMessage: RATE_PENDING_MESSAGE,
      minGhs: MIN_GHS_AMOUNT,
      standardFromGhs: STANDARD_TIER_MIN_GHS,
    }
    writeCachedExchangeRate(cached)
    setRate(standardRate)
    setSmallRate(small)
    setGhsPerRmb(1 / standardRate)
    setStatus("active")
    setTradingEnabled(true)
    setLoading(false)
    hasLoadedOnce.current = true
  }, [])

  const applyRate = useCallback((storedRate: StoredExchangeRate) => {
    applyRates(storedRate, storedRate)
  }, [applyRates])

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
        setSmallRate(state.smallRate)
        setGhsPerRmb(state.ghsPerRmb)
        setStatus(state.status)
        setTradingEnabled(state.tradingEnabled)
        setPendingMessage(state.pendingMessage)
        setLoading(false)
        setMinGhs(state.minGhs)
        setStandardFromGhs(state.standardFromGhs)
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
    const cached = readCachedExchangeRate()
    if (cached) {
      const state = cachedRateToState(cached)
      setRate(state.rate)
      setSmallRate(state.smallRate)
      setGhsPerRmb(state.ghsPerRmb)
      setStatus(state.status)
      setTradingEnabled(state.tradingEnabled)
      setPendingMessage(state.pendingMessage)
      setLoading(false)
      setMinGhs(state.minGhs)
      setStandardFromGhs(state.standardFromGhs)
      hasLoadedOnce.current = true
    }

    void load({ background: Boolean(cached) })
    const id = setInterval(() => {
      void load({ background: true })
    }, pollMs)
    return () => {
      clearInterval(id)
      if (retryTimer.current) clearTimeout(retryTimer.current)
    }
  }, [load, pollMs])

  return {
    rate,
    smallRate,
    ghsPerRmb,
    status,
    tradingEnabled,
    pendingMessage,
    loading,
    minGhs,
    standardFromGhs,
    refresh: () => load({ background: false }),
    applyRates,
    applyRate,
  }
}
