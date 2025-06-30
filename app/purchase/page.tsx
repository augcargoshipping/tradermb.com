"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Calculator, ChevronLeft, ChevronRight, Eye, EyeOff, User, Phone, Gift, DollarSign } from "lucide-react"

export const dynamic = "force-dynamic"

// Updated with dark red theme - 2025
// Build timestamp: 2025-01-27 15:30:00

interface FormData {
  fullName: string
  mobileNumber: string
  referralName: string
  ghsAmount: string
  alipayQR: File | null
}

interface FormErrors {
  fullName?: string
  mobileNumber?: string
  referralName?: string
  ghsAmount?: string
  alipayQR?: string
}

const testimonials = [
  {
    id: 1,
    name: "Nana A.",
    location: "Accra",
    text: "Super fast payment! My RMB was funded in just 3 minutes. The process was so smooth and the rates are unbeatable.",
    rating: 5
  },
  {
    id: 2,
    name: "Linda M.",
    location: "Kumasi", 
    text: "I was skeptical at first, but the payment came through instantly. Great customer service and very reliable platform.",
    rating: 5
  },
  {
    id: 3,
    name: "Kwame B.",
    location: "Tamale",
    text: "Best exchange service I've used. The speed is incredible - from payment to receiving RMB in under 5 minutes!",
    rating: 5
  },
  {
    id: 4,
    name: "Sarah K.",
    location: "Cape Coast",
    text: "Amazing experience! The referral bonus is a nice touch. I've already recommended it to all my business partners.",
    rating: 5
  },
  {
    id: 5,
    name: "Michael O.",
    location: "Tema",
    text: "Lightning fast service! I needed RMB urgently for my supplier and got it within minutes. Highly recommend!",
    rating: 5
  }
]

function PurchaseForm() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobileNumber: "",
    referralName: "",
    ghsAmount: "",
    alipayQR: null,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loadingRate, setLoadingRate] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

  // Prefill referralName from ?ref= param if present
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && !formData.referralName) {
      setFormData((prev) => ({ ...prev, referralName: ref }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch the current exchange rate
  useEffect(() => {
    async function loadRate() {
      try {
        const response = await fetch("/api/fetch-rate")
        const data = await response.json()
        
        if (data.success && data.rate !== null) {
          setExchangeRate(data.rate)
        } else {
          console.error("❌ Failed to load rate:", data.error)
          // Don't set a fallback rate - let the user see that rate is unavailable
          setExchangeRate(null)
        }
      } catch (err) {
        console.error("❌ Failed to load rate", err)
        // Don't set a fallback rate - let the user see that rate is unavailable
        setExchangeRate(null)
      } finally {
        setLoadingRate(false)
      }
    }
    loadRate()
  }, [])

  const calculateRMB = (ghsAmount: string): string => {
    const amount = Number.parseFloat(ghsAmount)
    if (isNaN(amount) || amount <= 0 || !exchangeRate) return "0.00"
    return (amount * exchangeRate).toFixed(2)
  }

  const handleInputChange = (field: keyof FormData, value: string | File | null) => {
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Please enter your full name"
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Please enter your mobile money number"
    } else if (!/^0\d{9}$/.test(formData.mobileNumber.replace(/\s/g, ""))) {
      newErrors.mobileNumber = "Please enter a valid Ghana mobile number"
    }

    if (!formData.ghsAmount || Number.parseFloat(formData.ghsAmount) <= 0) {
      newErrors.ghsAmount = "Please enter a valid GHS amount"
    }

    // QR code is now optional
    // if (!formData.alipayQR) {
    //   newErrors.alipayQR = "Please upload your Alipay QR code"
    // }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      console.log("🚀 Starting form submission...")
      console.log("📝 Form data:", {
        fullName: formData.fullName,
        mobileNumber: formData.mobileNumber,
        ghsAmount: formData.ghsAmount,
        hasQR: !!formData.alipayQR,
        qrSize: formData.alipayQR?.size,
        qrName: formData.alipayQR?.name
      })

      const submitData = new FormData()
      submitData.append("fullName", formData.fullName)
      submitData.append("mobileNumber", formData.mobileNumber)
      submitData.append("referralName", formData.referralName)
      submitData.append("ghsAmount", formData.ghsAmount)
      submitData.append("rmbAmount", calculateRMB(formData.ghsAmount))
      submitData.append("exchangeRate", exchangeRate?.toString() || "0")
      if (formData.alipayQR) {
        submitData.append("alipayQR", formData.alipayQR)
      }

      console.log("📤 Sending request to /api/submit-transaction...")
      const response = await fetch("/api/submit-transaction", {
        method: "POST",
        body: submitData,
      })

      console.log("📥 Response received:", response.status, response.statusText)
      const result = await response.json()
      console.log("📄 Response data:", result)

      if (result.success) {
        console.log("✅ Form submitted successfully!")
        const confirmationData = {
          ...formData,
          rmbAmount: calculateRMB(formData.ghsAmount),
          referenceCode: result.referenceCode,
          recordId: result.recordId,
          submittedAt: new Date().toISOString(),
        }

        sessionStorage.setItem("submissionData", JSON.stringify(confirmationData))
        router.push("/confirmation")
      } else {
        console.error("❌ Form submission failed:", result.error)
        alert(`Submission failed: ${result.error}\n\nDetails: ${result.details || "Please check your configuration"}`)
      }
    } catch (error) {
      console.error("💥 Form submission error:", error)
      alert("Failed to submit transaction. Please check your internet connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoBack = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-purple-600 py-8 px-2">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col items-center">
        <div className="flex flex-col items-center mb-4">
          <img src="/logo.png" alt="TRADE RMB Logo" className="w-12 h-12 object-contain mb-2" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight mb-2">TRADE RMB</span>
        </div>
        <h2 className="text-2xl font-bold text-purple-700 mb-1 text-center">RMB Purchase Form</h2>
        <p className="text-gray-500 mb-6 text-center">Fill in your details to buy Chinese Yuan with Ghana Cedis</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <label className="text-gray-900 font-semibold mb-1">Customer Full Name *</label>
          <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
            onChange={e => handleInputChange("fullName", e.target.value)}
            required
            className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.fullName && <div className="text-red-600 text-xs mt-1">{errors.fullName}</div>}

          <label className="text-gray-900 font-semibold mb-1">Mobile Money Number *</label>
          <input
                  type="tel"
                  placeholder="e.g., 0241234567"
                  value={formData.mobileNumber}
            onChange={e => handleInputChange("mobileNumber", e.target.value)}
            required
            className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.mobileNumber && <div className="text-red-600 text-xs mt-1">{errors.mobileNumber}</div>}

          <label className="text-gray-900 font-semibold mb-1">Referral Name <span className="text-gray-400">(Optional)</span></label>
          <input
                  type="text"
                  placeholder="Who referred you?"
                  value={formData.referralName}
            onChange={e => handleInputChange("referralName", e.target.value)}
            className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.referralName && <div className="text-red-600 text-xs mt-1">{errors.referralName}</div>}

          <label className="text-gray-900 font-semibold mb-1">Amount in GHS *</label>
          <input
                  type="number"
            placeholder="Amount in GHS"
                  value={formData.ghsAmount}
            onChange={e => handleInputChange("ghsAmount", e.target.value)}
            required
            min="1"
            className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {errors.ghsAmount && <div className="text-red-600 text-xs mt-1">{errors.ghsAmount}</div>}
          {exchangeRate && formData.ghsAmount && (
            <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 p-4 mt-2">
              <div className="flex items-center mb-2">
                <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                <span className="text-gray-700 font-semibold">You will receive:</span>
                <span className="ml-auto text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">¥{calculateRMB(formData.ghsAmount)}</span>
              </div>
              <div className="text-xs text-gray-500">Exchange Rate: 1 GHS = {exchangeRate.toFixed(2)} RMB</div>
            </div>
          )}

          <label className="text-gray-900 font-semibold mb-1">Upload Alipay QR Code *</label>
          <input
                    type="file"
                    accept="image/*"
            onChange={e => handleInputChange("alipayQR", e.target.files?.[0] || null)}
            required
            className="border rounded w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {qrPreview && (
            <img src={qrPreview} alt="QR Preview" className="w-24 h-24 object-contain rounded border mx-auto mt-2" />
          )}
          {errors.alipayQR && <div className="text-red-600 text-xs mt-1">{errors.alipayQR}</div>}

                      <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-4 py-3 font-bold text-lg shadow hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 mt-2"
                        disabled={isSubmitting}
                      >
            {isSubmitting ? "Processing..." : "Submit & Pay"}
                      </button>
          {Object.values(errors).some(Boolean) && (
            <div className="text-red-600 text-sm text-center">Please fix the errors above.</div>
          )}
            </form>
        <a href="/" className="mt-6 text-gray-400 text-xs hover:underline">&larr; Back to Home</a>
              </div>
      {/* Testimonials Section (always below the form) */}
      <div className="w-full max-w-md mt-8">
        <div className="bg-white/90 rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-purple-700 mb-2 text-center">What Customers Say</h3>
          <div className="text-gray-700 italic text-center mb-2">"{testimonials[currentTestimonial].text}"</div>
          <div className="text-sm text-gray-500 text-center">— {testimonials[currentTestimonial].name}, {testimonials[currentTestimonial].location}</div>
        </div>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseForm />
    </Suspense>
  );
}
