"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ArrowLeft, Smartphone, Clock, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { momoNumberToWhatsApp } from "@/lib/payment-settings"

interface SubmissionData {
  fullName: string
  mobileNumber: string
  referralName: string
  ghsAmount: string
  rmbAmount: string
  referenceCode: string
  recordId?: number
  submittedAt: string
  alipayQRData?: string
  alipayQRName?: string
}

export default function ConfirmationPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null)
  const [copied, setCopied] = useState(false)
  const [showReferModal, setShowReferModal] = useState(false)
  const [loadingRate, setLoadingRate] = useState(true)
  const [rate, setRate] = useState<number | null>(null)
  const [paymentNumber, setPaymentNumber] = useState<string | null>(null)
  const [paymentName, setPaymentName] = useState<string | null>(null)
  const [momoConfirmed, setMomoConfirmed] = useState(false)
  const [confirmingMomo, setConfirmingMomo] = useState(false)
  const [momoError, setMomoError] = useState<string | null>(null)
  const { toast } = useToast();

  useEffect(() => {
    // Get submission data from sessionStorage
    const storedData = sessionStorage.getItem("submissionData")
    if (storedData) {
      const parsed = JSON.parse(storedData) as SubmissionData
      setSubmissionData(parsed)
      if (parsed.referenceCode) {
        try {
          const confirmed = sessionStorage.getItem(`momoConfirmed_${parsed.referenceCode}`)
          if (confirmed === "1") setMomoConfirmed(true)
        } catch {
          /* ignore */
        }
      }
    } else {
      // Redirect to home if no data
      router.push("/")
    }
  }, [router])

  useEffect(() => {
    async function loadPaymentDetails() {
      try {
        const res = await fetch("/api/payment-details")
        const data = await res.json()
        if (data.success) {
          if (typeof data.number === "string") setPaymentNumber(data.number)
          if (typeof data.name === "string") setPaymentName(data.name)
        }
      } catch (err) {
        console.error("Failed to load payment details", err)
      }
    }
    loadPaymentDetails()
  }, [])

  const handleMomoConfirmed = async (checked: boolean) => {
    if (!checked || !submissionData?.recordId || momoConfirmed || confirmingMomo) return

    setConfirmingMomo(true)
    setMomoError(null)
    try {
      const res = await fetch("/api/orders/confirm-momo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: submissionData.recordId,
          referenceCode: submissionData.referenceCode,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setMomoError(data.error || "Could not confirm payment. Try again.")
        return
      }
      setMomoConfirmed(true)
      try {
        sessionStorage.setItem(`momoConfirmed_${submissionData.referenceCode}`, "1")
      } catch {
        /* ignore */
      }
      toast({
        title: data.alreadyConfirmed ? "Already recorded" : "Payment noted",
        description: data.alreadyConfirmed
          ? "We already have your MoMo confirmation on file."
          : "Thanks — our team has been notified to verify your payment.",
      })
    } catch {
      setMomoError("Network error. Check your connection and try again.")
    } finally {
      setConfirmingMomo(false)
    }
  }

  const handleCopyReference = async () => {
    if (submissionData?.referenceCode) {
      try {
        await navigator.clipboard.writeText(submissionData.referenceCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Failed to copy:", err)
      }
    }
  }

  const handleNewTransaction = () => {
    sessionStorage.removeItem("submissionData")
    router.push("/")
  }

  const handleReferralClick = () => {
    if (session) {
      setShowReferModal(true);
    } else {
      // If user is not signed in, redirect to sign in
      router.push("/auth/signin");
    }
  }

  const handleCopyLink = () => {
    if (session) {
      const userName = session.user?.name || session.user?.email || "User";
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(userName)}`;
      navigator.clipboard.writeText(referralLink);
      toast({ title: "Referral link copied!", description: "Share it with your friends." });
    }
  };

  const handleWhatsApp = () => {
    if (session) {
      const userName = session.user?.name || session.user?.email || "User";
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(userName)}`;
      const message = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
      window.open(`https://wa.me/?text=${message}`, "_blank");
    }
  };

  const handleSMS = () => {
    if (session) {
      const userName = session.user?.name || session.user?.email || "User";
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(userName)}`;
      const message = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
      window.open(`sms:?&body=${message}`);
    }
  };

  const handleEmail = () => {
    if (session) {
      const userName = session.user?.name || session.user?.email || "User";
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(userName)}`;
      const subject = encodeURIComponent("Join me on TRADE RMB!");
      const body = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  if (!submissionData) {
    return (
      <div className="page-shell hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell hero-gradient">
      <div className="container-tight section-pad flex w-full flex-1 flex-col items-center py-4 sm:py-8 safe-bottom">
        <div className="w-full max-w-lg space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center px-1">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 sm:h-20 sm:w-20">
            <CheckCircle className="h-10 w-10 text-green-600 sm:h-12 sm:w-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:text-3xl">Order Submitted!</h1>
          <p className="text-sm text-gray-600 sm:text-base">Your RMB purchase request has been received</p>
          <p className="mt-2 text-xs text-emerald-700 sm:text-sm">Payment instructions were also sent to your email.</p>
        </div>

        {/* Payment Instructions */}
        <Card className="w-full shadow-xl bg-white rounded-2xl border-0">
          <CardHeader className="text-center px-4 pb-3 pt-5 sm:px-6 sm:pb-4">
            <CardTitle className="text-lg text-gray-900 flex flex-wrap items-center justify-center gap-2 sm:text-xl">
              <Smartphone className="h-5 w-5 shrink-0 text-green-600 sm:h-6 sm:w-6" />
              Payment Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-6">
              {/* Mobile Money Payment Method */}
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Smartphone className="h-5 w-5 shrink-0 text-orange-600 sm:h-6 sm:w-6" />
                  <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Mobile Money Payment</h3>
                </div>
                <div className="rounded-lg border border-orange-300 bg-white p-3 text-center">
                  <p className="mb-2 text-sm font-medium text-gray-700">Send payment to:</p>
                  <p className="break-all text-xl font-bold text-orange-600 sm:text-2xl">
                    {paymentNumber ?? "Loading…"}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 sm:text-sm">(MTN Mobile Money)</p>
                  <p className="mt-2 text-sm font-medium text-gray-700">
                    {paymentName ?? "Loading…"}
                  </p>
                </div>
                <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <p className="mb-2 text-sm font-medium text-yellow-800">Important:</p>
                  <ul className="space-y-1.5 text-xs leading-relaxed text-yellow-700 sm:text-sm">
                    <li>Use reference code: <strong className="break-all">{submissionData.referenceCode}</strong></li>
                    <li>Send exactly GHS {submissionData.ghsAmount}</li>
                    <li>Keep your payment receipt</li>
                    <li><strong>⚠️ Pay from the same MoMo number you entered: {submissionData.mobileNumber}</strong></li>
                  </ul>
                </div>

                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="momo-sent"
                      checked={momoConfirmed}
                      disabled={momoConfirmed || confirmingMomo || !submissionData.recordId}
                      onCheckedChange={(value) => void handleMomoConfirmed(value === true)}
                      className="mt-0.5 h-5 w-5 border-emerald-600 data-[state=checked]:bg-emerald-600"
                    />
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="momo-sent" className="cursor-pointer text-sm font-semibold leading-snug text-emerald-900 sm:text-base">
                        I have sent the mobile money payment
                      </Label>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-800 sm:text-sm">
                        Tick this after you pay. Our team at August Cargo Logistics will be notified to verify your payment.
                      </p>
                      {confirmingMomo && (
                        <p className="mt-2 text-xs text-emerald-700">Notifying our team…</p>
                      )}
                      {momoConfirmed && (
                        <p className="mt-2 text-xs font-medium text-emerald-700 sm:text-sm">
                          ✓ Thanks — we&apos;ll verify your payment and send your RMB soon.
                        </p>
                      )}
                      {momoError && <p className="mt-2 text-xs text-red-600">{momoError}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Person Payment Option */}
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 sm:mt-6 sm:p-4">
                <h3 className="mb-2 text-base font-semibold text-gray-900 sm:text-lg">Prefer to Pay in Person?</h3>
                <p className="mb-3 text-sm leading-relaxed text-gray-700">
                  You can visit our office to pay in person. Please bring a valid ID card and your reference code.
                </p>
                <Button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Hello, I am a customer from TRADE RMB and I want to pay in person. My reference code is: ${submissionData.referenceCode}`
                    );
                    const whatsappUrl = `https://wa.me/${paymentNumber ? momoNumberToWhatsApp(paymentNumber) : "233594669717"}?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="mx-auto flex h-auto min-h-[44px] w-full max-w-full items-center justify-center whitespace-normal rounded-lg bg-red-700 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-red-800 sm:text-base"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Chat on WhatsApp to Book In-Person Payment
                </Button>
              </div>

              {/* Reference Code */}
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 sm:p-4">
                <p className="mb-2 text-sm font-medium text-gray-700">Your Reference Code:</p>
                <div className="flex flex-col gap-2 rounded-lg border border-yellow-300 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="break-all text-center font-mono text-xl font-bold text-yellow-700 sm:text-left sm:text-2xl">
                    {submissionData.referenceCode}
                  </span>
                  <Button onClick={handleCopyReference} variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
                    {copied ? <CheckCircle className="h-4 w-4 text-red-600" /> : <Copy className="h-4 w-4" />}
                    <span className="ml-2 sm:sr-only">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                </div>
                <p className="mt-2 text-xs font-medium text-yellow-700 sm:text-sm">
                  ⚠️ You MUST use this reference when making payment
                </p>
              </div>

              {/* Transaction Summary */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <h3 className="mb-3 font-semibold text-gray-900">Transaction Summary</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">Customer</span>
                    <span className="font-medium break-words text-right sm:max-w-[55%]">{submissionData.fullName}</span>
                  </div>
                  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-600">Mobile Number</span>
                    <span className="font-medium">{submissionData.mobileNumber}</span>
                  </div>
                  {submissionData.referralName && (
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-600">Referred by</span>
                      <span className="font-medium break-words text-right sm:max-w-[55%]">{submissionData.referralName}</span>
                    </div>
                  )}
                  <div className="mt-2 border-t border-gray-300 pt-2 space-y-2">
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-600">Amount to Pay</span>
                      <span className="font-bold text-red-600">GHS {submissionData.ghsAmount}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-600">You&apos;ll Receive</span>
                      <span className="font-bold text-blue-600">¥{submissionData.rmbAmount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-2">Next Steps:</h4>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Choose your preferred payment method above</li>
                      <li>Use reference code: <strong>{submissionData.referenceCode}</strong></li>
                      <li>Your RMB will be transferred within 24 hours</li>
                      <li>You'll receive SMS confirmation once complete</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full"
        >
          <div className="rounded-2xl border border-blue-200 bg-white p-4 text-center shadow-xl sm:p-6">
            <div className="flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gradient-brand">Refer & Earn</h2>
            </div>
            <p className="text-gray-700 mb-4 text-sm">
              While you wait, invite friends to TRADE RMB and earn cash rewards!
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="btn-primary inline-block cursor-pointer px-6 py-3"
              onClick={handleReferralClick}
            >
              Start Referring Now
            </motion.div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <Button
            onClick={handleNewTransaction}
            className="h-12 w-full rounded-xl bg-red-700 text-base font-bold text-white hover:bg-red-800"
          >
            Make Another Transaction
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="h-12 w-full rounded-xl border-gray-300 py-3 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Support Info */}
        <div className="w-full px-1 pb-2 text-center text-sm text-gray-500">
          <p>Need help? Contact our support team</p>
          <Button
            onClick={() => {
              const userName = session?.user?.name || "a customer";
              const message = encodeURIComponent(`Hello Trade RMB support! This is ${userName}.`)
              const whatsappUrl = `https://wa.me/${paymentNumber ? momoNumberToWhatsApp(paymentNumber) : "233594669717"}?text=${message}`
              window.open(whatsappUrl, '_blank')
            }}
            className="mx-auto mt-2 flex h-11 w-full max-w-xs items-center justify-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 sm:w-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            Chat on WhatsApp
          </Button>
        </div>
        </div>
      </div>

      {/* Referral Modal */}
      {showReferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative flex w-full max-w-sm flex-col items-center rounded-2xl border border-blue-200 bg-white p-6 shadow-2xl sm:p-8">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Share Your Referral Link</h3>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={handleWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </button>
              <button onClick={handleSMS} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2v-4.5M21 10.5l-9 6.5-9-6.5"/>
                </svg>
                SMS
              </button>
              <button onClick={handleEmail} className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm8 0a8 8 0 11-16 0 8 8 0 0116 0z"/>
                </svg>
                Email
              </button>
              <button onClick={handleCopyLink} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="2"/>
                  <path d="M9 9h6v6H9z"/>
                </svg>
                Copy Link
              </button>
            </div>
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowReferModal(false)}>&times;</button>
          </div>
        </div>
      )}
    </div>
  )
}
