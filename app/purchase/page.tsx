"use client"

import type React from "react"
import { useState, useEffect, useRef, Suspense, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Upload,
  Calculator,
  ChevronRight,
  User,
  Phone,
  Mail,
  Gift,
  CheckCircle2,
  ChevronDown,
} from "lucide-react"
import { useExchangeRate } from "@/hooks/use-exchange-rate"
import { convertGhsToRmb, convertRmbToGhs, formatAmount } from "@/lib/exchange-math"

export const dynamic = "force-dynamic"

interface FormData {
  fullName: string
  mobileNumber: string
  referralName: string
  ghsAmount: string
  rmbAmount: string
  currencyMode: "ghs-to-rmb" | "rmb-to-ghs"
  alipayQR: File | null
  email: string
}

interface FormErrors {
  fullName?: string
  mobileNumber?: string
  referralName?: string
  ghsAmount?: string
  rmbAmount?: string
  currencyMode?: string
  alipayQR?: string
  email?: string
}

const testimonials = [
  {
    id: 1,
    name: "Nana A.",
    location: "Accra",
    text: "Super fast payment! My RMB was funded in just 3 minutes. The process was so smooth and the rates are unbeatable.",
    rating: 5,
  },
  {
    id: 2,
    name: "Linda M.",
    location: "Kumasi",
    text: "I was skeptical at first, but the payment came through instantly. Great customer service and very reliable platform.",
    rating: 5,
  },
  {
    id: 3,
    name: "Kwame B.",
    location: "Tamale",
    text: "Best exchange service I've used. The speed is incredible - from payment to receiving RMB in under 5 minutes!",
    rating: 5,
  },
  {
    id: 4,
    name: "Sarah K.",
    location: "Cape Coast",
    text: "Amazing experience! The referral bonus is a nice touch. I've already recommended it to all my business partners.",
    rating: 5,
  },
  {
    id: 5,
    name: "Michael O.",
    location: "Tema",
    text: "Lightning fast service! I needed RMB urgently for my supplier and got it within minutes. Highly recommend!",
    rating: 5,
  },
]

const GHS_QUICK = [50, 100, 200, 500, 1000] as const
const RMB_QUICK = [500, 1000, 2000, 5000, 10000] as const

function normalizeGhMobile(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("233") && digits.length >= 12) {
    return `0${digits.slice(3, 12)}`
  }
  if (digits.length >= 9 && digits.startsWith("0")) {
    return digits.slice(0, 10)
  }
  if (digits.length === 9 && !digits.startsWith("0")) {
    return `0${digits}`
  }
  return digits.slice(0, 10)
}

function formatMobileDisplay(normalized: string): string {
  if (normalized.length <= 3) return normalized
  if (normalized.length <= 6) return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
  return `${normalized.slice(0, 3)} ${normalized.slice(3, 6)} ${normalized.slice(6)}`
}

function PurchaseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const [step, setStep] = useState(1)
  const [referralOpen, setReferralOpen] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobileNumber: "",
    referralName: "",
    ghsAmount: "",
    rmbAmount: "",
    currencyMode: "ghs-to-rmb",
    alipayQR: null,
    email: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    rate: rmbPerGhs,
    ghsPerRmb,
    loading: loadingRate,
    status: rateStatus,
    tradingEnabled,
    pendingMessage,
  } = useExchangeRate()
  const ratePending = rateStatus === "pending" || !tradingEnabled
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const hasPrefilledReferral = useRef(false)
  const hasPrefilledUser = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const ref = searchParams?.get("ref")
    if (ref && !hasPrefilledReferral.current) {
      setFormData((prev) => {
        if (!prev.referralName) {
          hasPrefilledReferral.current = true
          setReferralOpen(true)
          return { ...prev, referralName: ref }
        }
        return prev
      })
    }
  }, [searchParams])

  useEffect(() => {
    if (!session?.user || hasPrefilledUser.current) return
    setFormData((prev) => {
      const updates: Partial<FormData> = {}
      if (session.user?.name && !prev.fullName) updates.fullName = session.user.name
      if (session.user?.email && !prev.email) updates.email = session.user.email
      if (Object.keys(updates).length > 0) {
        hasPrefilledUser.current = true
        return { ...prev, ...updates }
      }
      return prev
    })
  }, [session?.user])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const calculateRMB = useCallback(
    (ghsAmount: string): string => {
      const amount = Number.parseFloat(ghsAmount)
      if (Number.isNaN(amount) || amount <= 0 || !rmbPerGhs) return "0.00"
      return formatAmount(convertGhsToRmb(amount, rmbPerGhs))
    },
    [rmbPerGhs]
  )

  const calculateGHS = useCallback(
    (rmbAmount: string): string => {
      const amount = Number.parseFloat(rmbAmount)
      if (Number.isNaN(amount) || amount <= 0 || !rmbPerGhs) return "0.00"
      return formatAmount(convertRmbToGhs(amount, rmbPerGhs))
    },
    [rmbPerGhs]
  )

  const handleInputChange = (field: keyof FormData, value: string | File | null) => {
    setSubmitError(null)
    setFormData((prev) => ({ ...prev, [field]: value }))

    if (field === "alipayQR" && value instanceof File) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setQrPreview(e.target?.result as string)
      }
      reader.readAsDataURL(value)
    } else if (field === "alipayQR" && !value) {
      setQrPreview(null)
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const setCurrencyMode = (mode: FormData["currencyMode"]) => {
    setFormData((prev) => {
      if (!rmbPerGhs) {
        return { ...prev, currencyMode: mode }
      }
      const next = { ...prev, currencyMode: mode }
      if (mode === "rmb-to-ghs" && prev.currencyMode === "ghs-to-rmb" && prev.ghsAmount) {
        const g = Number.parseFloat(prev.ghsAmount)
        if (!Number.isNaN(g) && g > 0) {
          next.rmbAmount = formatAmount(convertGhsToRmb(g, rmbPerGhs))
        }
      } else if (mode === "ghs-to-rmb" && prev.currencyMode === "rmb-to-ghs" && prev.rmbAmount) {
        const r = Number.parseFloat(prev.rmbAmount)
        if (!Number.isNaN(r) && r > 0) {
          next.ghsAmount = formatAmount(convertRmbToGhs(r, rmbPerGhs))
        }
      }
      return next
    })
    setErrors((prev) => ({ ...prev, currencyMode: undefined, ghsAmount: undefined, rmbAmount: undefined }))
  }

  const validateStep1 = (): boolean => {
    const next: FormErrors = {}
    if (loadingRate) {
      next.ghsAmount = "Exchange rate is loading. Please wait a moment."
      setErrors(next)
      return false
    }
    if (ratePending) {
      next.ghsAmount = `${pendingMessage}. New trades are paused until the rate is posted.`
      setErrors(next)
      return false
    }
    if (!rmbPerGhs) {
      next.ghsAmount = "Exchange rate is not available yet."
      setErrors(next)
      return false
    }
    if (formData.currencyMode === "ghs-to-rmb") {
      const v = Number.parseFloat(formData.ghsAmount)
      if (!formData.ghsAmount || Number.isNaN(v) || v <= 0) {
        next.ghsAmount = "Enter how much GHS you want to send"
      }
    } else {
      const v = Number.parseFloat(formData.rmbAmount)
      if (!formData.rmbAmount || Number.isNaN(v) || v <= 0) {
        next.rmbAmount = "Enter how much RMB you want to receive"
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateStep2 = (): boolean => {
    const next: FormErrors = {}
    if (!formData.fullName.trim()) {
      next.fullName = "Add your full name"
    }
    const mobile = normalizeGhMobile(formData.mobileNumber)
    if (!mobile) {
      next.mobileNumber = "Add your mobile money number"
    } else if (!/^0\d{9}$/.test(mobile)) {
      next.mobileNumber = "Use a valid Ghana number (10 digits, starting with 0)"
    }
    if (!formData.email.trim()) {
      next.email = "Add your email"
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      next.email = "That email does not look valid"
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateForm = (): boolean => {
    const next: FormErrors = {}
    if (loadingRate) {
      next.ghsAmount = "Exchange rate is loading. Please wait a moment."
    } else if (ratePending) {
      next.ghsAmount = `${pendingMessage}. New trades are paused until the rate is posted.`
    } else if (!rmbPerGhs) {
      next.ghsAmount = "Exchange rate is not available yet."
    } else if (formData.currencyMode === "ghs-to-rmb") {
      const v = Number.parseFloat(formData.ghsAmount)
      if (!formData.ghsAmount || Number.isNaN(v) || v <= 0) {
        next.ghsAmount = "Enter how much GHS you want to send"
      }
    } else {
      const v = Number.parseFloat(formData.rmbAmount)
      if (!formData.rmbAmount || Number.isNaN(v) || v <= 0) {
        next.rmbAmount = "Enter how much RMB you want to receive"
      }
    }

    if (!formData.fullName.trim()) {
      next.fullName = "Add your full name"
    }
    const mobile = normalizeGhMobile(formData.mobileNumber)
    if (!mobile) {
      next.mobileNumber = "Add your mobile money number"
    } else if (!/^0\d{9}$/.test(mobile)) {
      next.mobileNumber = "Use a valid Ghana number (10 digits, starting with 0)"
    }
    if (!formData.email.trim()) {
      next.email = "Add your email"
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      next.email = "That email does not look valid"
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const goNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
      return
    }
    if (step === 2) {
      const normalized = normalizeGhMobile(formData.mobileNumber)
      if (normalized !== formData.mobileNumber) {
        setFormData((prev) => ({ ...prev, mobileNumber: normalized }))
      }
      if (validateStep2()) setStep(3)
    }
  }

  const goBack = () => {
    if (step > 1) {
      setStep((s) => s - 1)
      return
    }
    router.push("/")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!validateForm()) {
      const step1Ok =
        !loadingRate &&
        !ratePending &&
        !!rmbPerGhs &&
        (formData.currencyMode === "ghs-to-rmb"
          ? Number.parseFloat(formData.ghsAmount) > 0
          : Number.parseFloat(formData.rmbAmount) > 0)
      if (!step1Ok) setStep(1)
      else setStep(2)
      setSubmitError("Please fix the highlighted fields, then try again.")
      return
    }

    setIsSubmitting(true)
    try {
      const submitData = new FormData()
      submitData.append("fullName", formData.fullName.trim())
      submitData.append("mobileNumber", normalizeGhMobile(formData.mobileNumber))
      submitData.append("referralName", formData.referralName || "")
      if (formData.currencyMode === "ghs-to-rmb") {
        submitData.append("ghsAmount", formData.ghsAmount)
        submitData.append("rmbAmount", calculateRMB(formData.ghsAmount))
      } else {
        submitData.append("rmbAmount", formData.rmbAmount)
        submitData.append("ghsAmount", calculateGHS(formData.rmbAmount))
      }
      submitData.append("exchangeRate", rmbPerGhs != null ? String(rmbPerGhs) : "0")
      submitData.append("email", formData.email.trim())
      if (formData.alipayQR && formData.alipayQR.size > 0) {
        submitData.append("alipayQR", formData.alipayQR)
      }

      const response = await fetch("/api/submit-transaction", {
        method: "POST",
        body: submitData,
        credentials: "include",
      })

      const raw = await response.text()
      let result: { success?: boolean; error?: string; details?: string; referenceCode?: string; recordId?: number }
      try {
        result = raw ? JSON.parse(raw) : {}
      } catch {
        setSubmitError(
          response.ok
            ? "Unexpected response from server. Please try again."
            : `Server error (${response.status}). Please try again.`
        )
        return
      }

      if (response.ok && result.success) {
        const mobile = normalizeGhMobile(formData.mobileNumber)
        const ghsOut =
          formData.currencyMode === "ghs-to-rmb" ? formData.ghsAmount : calculateGHS(formData.rmbAmount)
        const rmbOut =
          formData.currencyMode === "ghs-to-rmb" ? calculateRMB(formData.ghsAmount) : formData.rmbAmount

        const confirmationData = {
          fullName: formData.fullName.trim(),
          mobileNumber: mobile,
          referralName: formData.referralName || "",
          ghsAmount: ghsOut,
          rmbAmount: rmbOut,
          currencyMode: formData.currencyMode,
          email: formData.email.trim(),
          referenceCode: result.referenceCode,
          recordId: result.recordId,
          submittedAt: new Date().toISOString(),
        }

        try {
          sessionStorage.setItem("submissionData", JSON.stringify(confirmationData))
        } catch {
          setSubmitError(
            "Could not save your confirmation locally (browser storage). Allow storage or turn off private mode, then try again."
          )
          return
        }
        window.location.assign("/confirmation")
        return
      }

      const msg = [result.error, result.details].filter(Boolean).join(" — ") || `Request failed (${response.status})`
      setSubmitError(msg)
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Network error. Check your connection and try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const progressPct = ((step - 1) / 2) * 100
  const displayMobile = formatMobileDisplay(normalizeGhMobile(formData.mobileNumber))

  const summaryGhs =
    formData.currencyMode === "ghs-to-rmb" ? formData.ghsAmount : calculateGHS(formData.rmbAmount)
  const summaryRmb =
    formData.currencyMode === "ghs-to-rmb" ? calculateRMB(formData.ghsAmount) : formData.rmbAmount

  return (
    <div className="page-shell hero-gradient">
      <div className="container-tight section-pad flex flex-1 flex-col items-center py-4 sm:py-8">
      <div className="glass-card flex w-full max-w-lg flex-col p-5 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Button type="button" variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={goBack} aria-label={step === 1 ? "Back to home" : "Previous step"}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <img src="/logo-nav.png?v=3" alt="" className="w-9 h-9 object-contain" />
              <span className="font-extrabold text-emerald-800 truncate">TRADE RMB</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1.5">
              Step {step} of 3 — {step === 1 ? "Your trade" : step === 2 ? "Your contact" : "Review & send"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 gap-6">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">How much are you trading?</h2>
                <p className="text-sm text-muted-foreground mt-1">Pick a direction, then enter one amount — we calculate the other.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrencyMode("ghs-to-rmb")}
                  className={cn(
                    "rounded-xl border-2 p-3 text-left transition-all",
                    formData.currencyMode === "ghs-to-rmb"
                      ? "border-emerald-600 bg-emerald-50 shadow-md ring-2 ring-emerald-200"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/80"
                  )}
                >
                  <span className="text-2xl leading-none">₵</span>
                  <span className="block text-sm font-semibold text-gray-900 mt-1">I have Cedis</span>
                  <span className="text-xs text-muted-foreground">Pay in GHS → get RMB</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrencyMode("rmb-to-ghs")}
                  className={cn(
                    "rounded-xl border-2 p-3 text-left transition-all",
                    formData.currencyMode === "rmb-to-ghs"
                      ? "border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-200"
                      : "border-gray-200 hover:border-gray-300 bg-gray-50/80"
                  )}
                >
                  <span className="text-2xl leading-none">¥</span>
                  <span className="block text-sm font-semibold text-gray-900 mt-1">I want Yuan</span>
                  <span className="text-xs text-muted-foreground">Target RMB → pay GHS</span>
                </button>
              </div>

              {formData.currencyMode === "ghs-to-rmb" ? (
                <div className="space-y-3">
                  <Label htmlFor="ghs" className="text-base font-semibold">
                    Amount in GHS
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₵</span>
                    <Input
                      id="ghs"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formData.ghsAmount}
                      onChange={(e) => handleInputChange("ghsAmount", e.target.value)}
                      className={cn("pl-9 text-lg h-12", errors.ghsAmount && "border-red-500")}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GHS_QUICK.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleInputChange("ghsAmount", String(n))}
                        className="rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                      >
                        ₵{n}
                      </button>
                    ))}
                  </div>
                  {errors.ghsAmount && <p className="text-sm text-red-600">{errors.ghsAmount}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="rmb" className="text-base font-semibold">
                    Amount in RMB
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">¥</span>
                    <Input
                      id="rmb"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={formData.rmbAmount}
                      onChange={(e) => handleInputChange("rmbAmount", e.target.value)}
                      className={cn("pl-9 text-lg h-12", errors.rmbAmount && "border-red-500")}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {RMB_QUICK.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleInputChange("rmbAmount", String(n))}
                        className="rounded-full border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                      >
                        ¥{n.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  {errors.rmbAmount && <p className="text-sm text-red-600">{errors.rmbAmount}</p>}
                </div>
              )}

              {loadingRate ? (
                <p className="text-sm text-muted-foreground">Loading today&apos;s rate…</p>
              ) : ratePending ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">{pendingMessage}</p>
                  <p className="mt-1 text-amber-800/90">
                    You can&apos;t start a new trade until an admin posts today&apos;s rate. Check back soon.
                  </p>
                </div>
              ) : !rmbPerGhs || !ghsPerRmb ? (
                <p className="text-sm text-muted-foreground">Rate is not available yet.</p>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-amber-50/80 p-4">
                  <div className="flex items-start gap-2">
                    <Calculator className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                      {(formData.currencyMode === "ghs-to-rmb" ? formData.ghsAmount : formData.rmbAmount) ? (
                        <>
                          <p className="text-muted-foreground">
                            {formData.currencyMode === "ghs-to-rmb" ? "You receive about" : "You pay about"}
                          </p>
                          <p className="text-2xl font-bold text-gradient-brand">
                            {formData.currencyMode === "ghs-to-rmb"
                              ? `¥${calculateRMB(formData.ghsAmount)}`
                              : `₵${calculateGHS(formData.rmbAmount)}`}
                          </p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Enter an amount to see your conversion.</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        Today&apos;s rate: 1 RMB = {ghsPerRmb.toFixed(2)} GHS
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="button"
                onClick={goNext}
                disabled={loadingRate || ratePending}
                className="w-full h-12 text-base font-semibold gap-2"
                size="lg"
              >
                Continue
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">How do we reach you?</h2>
                <p className="text-sm text-muted-foreground mt-1">We use this for payment updates and your receipt.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center gap-2 font-semibold">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  Mobile money number
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="024 123 4567"
                  value={displayMobile}
                  onChange={(e) => handleInputChange("mobileNumber", normalizeGhMobile(e.target.value))}
                  className={cn("h-12 text-lg tracking-wide", errors.mobileNumber && "border-red-500")}
                />
                {errors.mobileNumber && <p className="text-sm text-red-600">{errors.mobileNumber}</p>}
                <p className="text-xs text-muted-foreground">Ghana numbers only. You can paste 233… we normalize it.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 font-semibold">
                  <User className="h-4 w-4 text-emerald-600" />
                  Full name
                </Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="As on your ID"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={cn("h-11", errors.fullName && "border-red-500")}
                />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 font-semibold">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={cn("h-11", errors.email && "border-red-500")}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              <Button type="button" onClick={goNext} className="w-full h-12 text-base font-semibold gap-2" size="lg">
                Continue
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">Almost there</h2>
                <p className="text-sm text-muted-foreground mt-1">Optional extras, then submit when everything looks right.</p>
              </div>

              {submitError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {submitError}
                </div>
              )}

              <div className="rounded-xl border bg-gray-50/80 p-4 space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">You pay</span>
                  <span className="font-semibold">GHS {summaryGhs}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">You receive</span>
                  <span className="font-semibold">¥{summaryRmb}</span>
                </div>
                <div className="flex justify-between gap-2 pt-2 border-t">
                  <span className="text-muted-foreground">Contact</span>
                  <span className="font-medium text-right truncate max-w-[55%]">
                    {formatMobileDisplay(normalizeGhMobile(formData.mobileNumber))}
                    <br />
                    <span className="text-muted-foreground font-normal">{formData.email}</span>
                  </span>
                </div>
              </div>

              <Collapsible open={referralOpen} onOpenChange={setReferralOpen}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-dashed px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-amber-600" />
                      Referral name (optional)
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", referralOpen && "rotate-180")} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <Input
                    placeholder="Who referred you?"
                    value={formData.referralName}
                    onChange={(e) => handleInputChange("referralName", e.target.value)}
                    className="h-10"
                  />
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-2">
                <Label className="font-semibold">Alipay QR (optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleInputChange("alipayQR", e.target.files?.[0] || null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const f = e.dataTransfer.files?.[0]
                    if (f?.type.startsWith("image/")) handleInputChange("alipayQR", f)
                  }}
                  className={cn(
                    "w-full rounded-xl border-2 border-dashed py-8 px-4 text-center transition-colors hover:bg-emerald-50/50",
                    qrPreview ? "border-emerald-300 bg-emerald-50/30" : "border-gray-200"
                  )}
                >
                  {qrPreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <img src={qrPreview} alt="" className="h-28 w-28 object-contain rounded-lg border bg-white" />
                      <span className="text-sm text-emerald-700 font-medium">Tap to change image</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                      <span className="text-sm">Drop or tap to attach your Alipay QR</span>
                      <span className="text-xs">PNG or JPG — skip if you will send it later</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-900">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 mt-0.5" />
                <span>Submitting creates your order. You&apos;ll get a reference code on the next screen.</span>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold btn-primary rounded-xl"
                size="lg"
                disabled={isSubmitting || ratePending || loadingRate}
              >
                {isSubmitting ? "Sending…" : "Submit order"}
              </Button>
            </div>
          )}
        </form>

        <a href="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-gray-900 hover:underline">
          ← Back to home
        </a>
      </div>

      <div className="w-full max-w-lg mt-6">
        <div className="bg-white/90 rounded-2xl shadow p-5">
          <h3 className="text-base font-bold text-emerald-800 mb-2 text-center">What customers say</h3>
          <p className="text-gray-700 italic text-center text-sm leading-relaxed">&ldquo;{testimonials[currentTestimonial].text}&rdquo;</p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            — {testimonials[currentTestimonial].name}, {testimonials[currentTestimonial].location}
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell hero-gradient flex items-center justify-center font-medium text-emerald-800">
          Loading…
        </div>
      }
    >
      <PurchaseForm />
    </Suspense>
  )
}
