"use client"

import { ArrowRight, Clock, TrendingUp } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { RateDisplayStatus } from "@/hooks/use-exchange-rate"

type RateStripProps = {
  loading: boolean
  status: RateDisplayStatus
  ghsPerRmb: number | null
  pendingMessage: string
  tradingEnabled: boolean
  onRateTap?: () => void
  className?: string
}

export function RateStrip({
  loading,
  status,
  ghsPerRmb,
  pendingMessage,
  tradingEnabled,
  onRateTap,
  className,
}: RateStripProps) {
  const showPending = !loading && status === "pending"
  const showActive = !loading && status === "active" && ghsPerRmb !== null

  return (
    <section
      aria-label="Live exchange rate"
      className={cn(
        "relative border-b border-emerald-400/30 bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 text-white",
        className
      )}
    >
      <div className="absolute inset-0 mesh-dots opacity-25" aria-hidden />
      <div className="container-tight section-pad relative py-4 sm:py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-100/90">
          Today&apos;s exchange rate
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-50">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-300" />
              Loading today&apos;s rate…
            </span>
          </div>
        ) : showPending ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onRateTap}
              className="flex flex-1 flex-col gap-2 rounded-2xl border border-amber-300/40 bg-amber-500/15 px-5 py-4 text-left backdrop-blur-sm transition hover:bg-amber-500/25 sm:max-w-xl"
            >
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-900/30 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-50">
                <Clock className="h-3.5 w-3.5" />
                Coming soon
              </span>
              <p className="font-display text-xl font-bold tracking-tight sm:text-2xl">{pendingMessage}</p>
              <p className="text-xs text-amber-100/90">New trades are paused until the rate is updated.</p>
            </button>
            <span
              className="inline-flex shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/20 px-6 py-3.5 text-sm font-bold text-white/70 sm:min-w-[160px]"
              aria-disabled
            >
              Trading paused
            </span>
          </div>
        ) : showActive ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={onRateTap}
              className="group flex flex-1 flex-col gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-left backdrop-blur-sm transition hover:border-white/35 hover:bg-white/15 sm:max-w-xl"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/40 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-50">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  </span>
                  Live rate
                </span>
                <span className="text-xs text-emerald-100/90">Ghana Cedis → Chinese Yuan</span>
              </div>

              <p className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                1 RMB = {ghsPerRmb.toFixed(2)} GHS
              </p>

              <p className="text-xs text-emerald-100/75">
                Same rate on purchase & calculator
              </p>
            </button>

            <Link
              href={tradingEnabled ? "/purchase" : "#"}
              aria-disabled={!tradingEnabled}
              className={cn(
                "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg sm:min-w-[160px]",
                tradingEnabled
                  ? "bg-white text-emerald-800 shadow-emerald-950/20 transition hover:bg-emerald-50"
                  : "pointer-events-none border border-white/20 bg-white/20 text-white/70"
              )}
            >
              Start trade
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
