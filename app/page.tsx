"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  MessageCircle,
  ChevronDown,
  Smartphone,
  Wallet,
  CheckCircle2,
  Users,
  BadgeCheck,
} from "lucide-react"
import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"
import { RateStrip } from "@/components/site/rate-strip"
import { RateAdminDialog } from "@/components/site/rate-admin-dialog"
import { HomePageFallback } from "@/components/site/home-fallback"
import { HeroSlideshow } from "@/components/site/hero-slideshow"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { RATE_ADMIN_TAP_COUNT, RATE_ADMIN_TAP_WINDOW_MS } from "@/lib/rate-admin-access"

const features = [
  {
    icon: Zap,
    title: "Fast settlement",
    text: "Most trades complete in minutes once your mobile money payment is confirmed.",
    accent: "from-amber-400 to-orange-400",
  },
  {
    icon: ShieldCheck,
    title: "Secure & tracked",
    text: "Every order gets a reference code, status updates, and a personal dashboard.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    icon: Clock,
    title: "Live rates",
    text: "One central rate powers the homepage, purchase form, and calculator — always in sync.",
    accent: "from-blue-400 to-cyan-500",
  },
]

const steps = [
  { n: "01", title: "Enter amount", text: "Choose GHS or RMB and see your conversion instantly." },
  { n: "02", title: "Submit details", text: "Add contact info and optional Alipay QR for payout." },
  { n: "03", title: "Pay & receive", text: "Pay via mobile money — we send RMB once confirmed." },
]

const faqs = [
  {
    q: "How do I pay?",
    a: "Use mobile money (MTN, Vodafone, AirtelTigo) after submitting your trade. Instructions appear on the confirmation screen.",
  },
  {
    q: "How fast will I receive RMB?",
    a: "Typically within minutes after we confirm your payment, depending on volume and verification.",
  },
  {
    q: "Is there a minimum amount?",
    a: "Check the purchase form for current limits. Quick amount buttons help you start faster on mobile.",
  },
]

function LandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ghsPerRmb, loading, status, tradingEnabled, pendingMessage, applyRate } = useExchangeRate()
  const [referralName, setReferralName] = useState("")
  const [portalOpen, setPortalOpen] = useState(false)
  const tapCount = useRef(0)
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref) setReferralName(decodeURIComponent(ref))
  }, [searchParams])

  const handleRateTap = () => {
    tapCount.current += 1
    if (tapTimer.current) clearTimeout(tapTimer.current)
    tapTimer.current = setTimeout(() => {
      tapCount.current = 0
    }, RATE_ADMIN_TAP_WINDOW_MS)
    if (tapCount.current >= RATE_ADMIN_TAP_COUNT) {
      tapCount.current = 0
      setPortalOpen(true)
    }
  }

  return (
    <div className="page-shell hero-gradient">
      <SiteHeader onBuy={() => router.push("/purchase")} />
      <RateStrip
        loading={loading}
        status={status}
        ghsPerRmb={ghsPerRmb}
        pendingMessage={pendingMessage}
        tradingEnabled={tradingEnabled}
        onRateTap={handleRateTap}
      />

      {referralName && (
        <div className="border-b border-amber-300/50 bg-gradient-to-r from-amber-100 to-amber-50 py-3 text-center text-sm font-semibold text-amber-900">
          Welcome, {referralName} — you&apos;re in the right place.
        </div>
      )}

      <main className="relative flex-1">
        {/* Hero — always visible (no scroll animations) */}
        <section className="relative overflow-hidden">
          <div className="hero-glow-ring -left-24 top-0 h-72 w-72" aria-hidden />
          <div className="container-tight section-pad relative py-10 sm:py-16 lg:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <div className="glass-card relative z-10 p-6 sm:p-9 lg:p-10">
                <div className="relative z-10">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge-pill">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Trusted exchange
                    </span>
                    <span className="badge-pill border-amber-200/80 bg-amber-50 text-amber-900">
                      Ghana → China
                    </span>
                  </div>
                  <h1 className="mt-5 font-display text-[clamp(1.75rem,6.5vw,3.25rem)] font-extrabold leading-[1.08] tracking-tight text-slate-900">
                    Pay with MoMo, get{" "}
                    <span className="text-gradient-brand">RMB on Alipay</span>
                  </h1>
                  <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                    Send Ghana Cedis, receive Chinese Yuan at today&apos;s rate — tracked orders,
                    minutes-not-days settlement, all from your phone.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Link href="/purchase" className="btn-primary">
                      Start your trade
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/auth/signin" className="btn-outline-light">
                      Sign in / Dashboard
                    </Link>
                  </div>
                  {loading ? (
                    <p className="mt-5 text-sm text-muted-foreground">Fetching live rate…</p>
                  ) : status === "pending" ? (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-2.5">
                      <span className="text-sm text-amber-900">
                        <strong>{pendingMessage}</strong> — trading paused for now.
                      </span>
                    </div>
                  ) : ghsPerRmb !== null ? (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-sm text-slate-700">
                        Today: <strong className="text-emerald-800">1 RMB = {ghsPerRmb.toFixed(2)} GHS</strong>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <HeroSlideshow />
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-emerald-200/60 bg-gradient-to-r from-emerald-700 to-teal-700 py-7 text-white sm:py-8">
          <div className="container-tight section-pad">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
              {[
                { label: "Settlement", value: "Minutes", icon: Zap },
                { label: "Payments", value: "MoMo", icon: Smartphone },
                { label: "Payout", value: "Alipay", icon: Wallet },
                { label: "Support", value: "WhatsApp", icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="stat-tile">
                  <Icon className="mb-1.5 h-5 w-5 text-emerald-300" />
                  <span className="text-base font-bold sm:text-lg">{value}</span>
                  <span className="text-[11px] text-emerald-100/90 sm:text-xs">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mesh-dots py-12 sm:py-16">
          <div className="container-tight section-pad">
            <h2 className="section-heading">How it works</h2>
            <p className="section-sub">Three steps from quote to RMB in your Alipay.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.n} className="step-card">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-base font-bold text-white shadow-md">
                    {step.n}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-12 sm:py-16">
          <div className="container-tight section-pad">
            <h2 className="section-heading">Why traders choose us</h2>
            <p className="section-sub">Professional, mobile-first, built for real trading.</p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, text, accent }) => (
                <div key={title} className="feature-card">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-14">
          <div className="container-tight section-pad text-center">
            <h2 className="section-heading">Pay & receive your way</h2>
            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <div className="feature-card flex flex-1 flex-col items-center gap-3 p-6 sm:max-w-xs">
                <Image src="/alipay_logo.svg" alt="Alipay" width={48} height={48} className="h-12 w-auto" />
                <p className="font-bold text-slate-900">Receive via Alipay</p>
              </div>
              <div className="feature-card flex flex-1 flex-col items-center gap-3 p-6 sm:max-w-xs">
                <Smartphone className="h-12 w-12 text-emerald-600" />
                <p className="font-bold text-slate-900">Pay with Mobile Money</p>
              </div>
            </div>
          </div>
        </section>

        <section className="container-tight section-pad py-12 sm:py-16">
          <div className="cta-panel">
            <h2 className="relative z-10 font-display text-2xl font-bold text-white sm:text-3xl">
              Ready to trade?
            </h2>
            <p className="relative z-10 mx-auto mt-3 max-w-md text-sm text-emerald-100/90">
              Get your reference code in under a minute.
            </p>
            <Link href="/purchase" className="btn-accent relative z-10 mt-6">
              Open purchase form
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="bg-slate-50/80 py-12 sm:pb-20">
          <div className="container-tight section-pad">
            <h2 className="section-heading">Questions & answers</h2>
            <div className="mx-auto mt-6 max-w-2xl space-y-3">
              {faqs.map(({ q, a }) => (
                <details
                  key={q}
                  className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                    {q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-emerald-600 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <a
          href="https://wa.me/233270373565"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg ring-4 ring-white/90 sm:bottom-8 sm:right-8"
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-7 w-7" />
        </a>
      </main>

      <SiteFooter />
      <RateAdminDialog
        open={portalOpen}
        onOpenChange={setPortalOpen}
        onRateSaved={(storedRate) => {
          applyRate(storedRate)
          void refresh()
        }}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageFallback />}>
      <LandingContent />
    </Suspense>
  )
}
