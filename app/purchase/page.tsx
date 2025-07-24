"use client"

import type React from "react"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { ArrowLeft, Upload, Calculator, ChevronLeft, ChevronRight, Eye, EyeOff, User, Phone, Gift, DollarSign } from "lucide-react"

export const dynamic = "force-dynamic"

// Updated with dark red theme - 2025
// Build timestamp: 2025-01-27 15:30:00

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
  const { data: session } = useSession();
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobileNumber: "",
    referralName: "",
    ghsAmount: "",
    rmbAmount: "",
    currencyMode: "ghs-to-rmb",
    alipayQR: null,
    email: ""
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [qrPreview, setQrPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loadingRate, setLoadingRate] = useState(true)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const hasPrefilledReferral = useRef(false)
  const hasPrefilledUser = useRef(false)
  
  // Dynamic rate state
  const [currentRateType, setCurrentRateType] = useState<"standard" | "low rmb" | null>(null)
  const [showLowRmbModal, setShowLowRmbModal] = useState(false)
  const [lowRmbRate, setLowRmbRate] = useState<number | null>(null)
  const [hasShownModal, setHasShownModal] = useState(false)

  // Prefill referralName from ?ref= param if present
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && !hasPrefilledReferral.current) {
      setFormData((prev) => {
        if (!prev.referralName) {
          hasPrefilledReferral.current = true;
          return { ...prev, referralName: ref };
        }
        return prev;
      });
    }
  }, [searchParams]);

  // Prefill user's name and email if signed in
  useEffect(() => {
    if (session?.user && !hasPrefilledUser.current) {
      const updates: Partial<FormData> = {};
      
      if (session.user.name && !formData.fullName) {
        updates.fullName = session.user.name;
      }
      
      if (session.user.email && !formData.email) {
        updates.email = session.user.email;
      }
      
      if (Object.keys(updates).length > 0) {
        setFormData((prev) => ({ ...prev, ...updates }));
        hasPrefilledUser.current = true;
      }
    }
  }, [session?.user]);

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
        
        if (data.success) {
          if (data.rates) {
            // New dynamic rate system
            if (data.rates.standard !== null) {
              setExchangeRate(data.rates.standard)
              setCurrentRateType("standard")
            }
            if (data.rates.lowRmb !== null) {
              setLowRmbRate(data.rates.lowRmb)
            }
          } else if (data.rate !== null) {
            // Legacy fallback
            setExchangeRate(data.rate)
            setCurrentRateType("standard")
          }
        } else {
          console.error("❌ Failed to load rate:", data.error)
          setExchangeRate(null)
        }
      } catch (err) {
        console.error("❌ Failed to load rate", err)
        setExchangeRate(null)
      } finally {
        setLoadingRate(false)
      }
    }
    loadRate()
    
    // Cleanup function for debounced rate calculation
    return () => {
      if (debouncedGetRate.current) {
        clearTimeout(debouncedGetRate.current)
      }
    }
  }, [])

  const calculateRMB = (ghsAmount: string): string => {
    const amount = Number.parseFloat(ghsAmount)
    if (isNaN(amount) || amount <= 0 || !exchangeRate) return "0.00"
    const result = (amount * exchangeRate).toFixed(2)
    console.log(`🧮 Calculating RMB: ${amount} GHS × ${exchangeRate} = ${result} RMB (Rate Type: ${currentRateType})`)
    return result
  }

  const calculateGHS = (rmbAmount: string): string => {
    const amount = Number.parseFloat(rmbAmount)
    if (isNaN(amount) || amount <= 0 || !exchangeRate) return "0.00"
    const result = (amount / exchangeRate).toFixed(2)
    console.log(`🧮 Calculating GHS: ${amount} RMB ÷ ${exchangeRate} = ${result} GHS (Rate Type: ${currentRateType})`)
    return result
  }

  // Dynamic rate calculation for RMB amounts (debounced)
  const getRateForAmount = async (rmbAmount: number) => {
    try {
      console.log(`🔍 Getting rate for RMB amount: ${rmbAmount}`)
      const response = await fetch(`/api/fetch-rate?rmbAmount=${rmbAmount}`)
      const data = await response.json()
      
      console.log(`📊 Rate API response:`, data)
      
      if (data.success && data.rate !== null) {
        console.log(`✅ Rate found: ${data.rate} (${data.type})`)
        setExchangeRate(data.rate)
        setCurrentRateType(data.type)
        
        // Show modal for low RMB amounts ONLY when:
        // 1. Amount is < 1000
        // 2. Rate type is "low rmb" 
        // 3. Modal hasn't been shown yet
        // 4. Standard and low RMB rates are different (not equal)
        if (rmbAmount < 1000 && data.type === "low rmb" && !hasShownModal) {
          // Check if rates are different before showing modal
          const ratesResponse = await fetch("/api/fetch-rate")
          const ratesData = await ratesResponse.json()
          
          if (ratesData.success && ratesData.rates) {
            const { standard, lowRmb } = ratesData.rates
            const ratesAreEqual = standard !== null && lowRmb !== null && standard === lowRmb
            
            if (!ratesAreEqual) {
              console.log(`🔔 Showing modal for low RMB amount: ${rmbAmount} (rates are different)`)
              setShowLowRmbModal(true)
              setHasShownModal(true)
            } else {
              console.log(`ℹ️ Skipping modal - rates are equal (standard: ${standard}, lowRmb: ${lowRmb})`)
            }
          } else {
            console.log(`ℹ️ Skipping modal - couldn't fetch rates for comparison`)
          }
        } else {
          console.log(`ℹ️ Modal conditions not met: amount=${rmbAmount}, type=${data.type}, hasShown=${hasShownModal}`)
        }
        
        return data.rate
      } else {
        console.log(`❌ Rate API failed:`, data.error)
      }
    } catch (error) {
      console.error("❌ Failed to get rate for amount:", error)
    }
    return exchangeRate
  }

  // Debounced function to only trigger rate calculation after user stops typing
  const debouncedGetRate = useRef<NodeJS.Timeout | null>(null)

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

    // Dynamic rate calculation for RMB amounts (debounced)
    if (field === "rmbAmount" && typeof value === "string") {
      const rmbAmount = Number.parseFloat(value)
      console.log(`🔍 RMB amount changed to: ${rmbAmount}`)
      
      // Clear previous timeout
      if (debouncedGetRate.current) {
        clearTimeout(debouncedGetRate.current)
      }
      
      // Set new timeout to wait for user to finish typing
      debouncedGetRate.current = setTimeout(() => {
        if (!isNaN(rmbAmount) && rmbAmount > 0) {
          console.log(`🔍 Fetching rate for RMB amount: ${rmbAmount}`)
          getRateForAmount(rmbAmount)
        }
      }, 1000) // Wait 1 second after user stops typing
    }

    // Dynamic rate calculation for GHS amounts (debounced)
    if (field === "ghsAmount" && typeof value === "string") {
      const ghsAmount = Number.parseFloat(value)
      console.log(`🔍 GHS amount changed to: ${ghsAmount}`)
      
      // Clear previous timeout
      if (debouncedGetRate.current) {
        clearTimeout(debouncedGetRate.current)
      }
      
      // Set new timeout to wait for user to finish typing
      debouncedGetRate.current = setTimeout(() => {
        if (!isNaN(ghsAmount) && ghsAmount > 0 && exchangeRate) {
          // Calculate what RMB amount this would be
          const estimatedRmbAmount = ghsAmount * exchangeRate
          console.log(`🔍 Estimated RMB amount: ${estimatedRmbAmount}`)
          
          if (estimatedRmbAmount < 1000) {
            console.log(`🔍 Fetching rate for estimated RMB amount: ${estimatedRmbAmount}`)
            getRateForAmount(estimatedRmbAmount)
          } else {
            // For amounts ≥ 1000, ensure we use standard rate
            console.log(`🔍 Using standard rate for estimated RMB amount: ${estimatedRmbAmount}`)
            getRateForAmount(estimatedRmbAmount)
          }
        }
      }, 1000) // Wait 1 second after user stops typing
    }

    // Reset modal flag when amounts are cleared
    if ((field === "rmbAmount" || field === "ghsAmount") && (!value || value === "")) {
      console.log("🔄 Resetting modal flag - amount cleared")
      setHasShownModal(false)
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

    if (formData.currencyMode === "ghs-to-rmb" && (!formData.ghsAmount || Number.parseFloat(formData.ghsAmount) <= 0)) {
      newErrors.ghsAmount = "Please enter a valid GHS amount"
    }

    if (formData.currencyMode === "rmb-to-ghs" && (!formData.rmbAmount || Number.parseFloat(formData.rmbAmount) <= 0)) {
      newErrors.rmbAmount = "Please enter a valid RMB amount"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address"
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
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
      if (formData.currencyMode === "ghs-to-rmb") {
        submitData.append("ghsAmount", formData.ghsAmount)
        submitData.append("rmbAmount", calculateRMB(formData.ghsAmount))
      } else {
        submitData.append("rmbAmount", formData.rmbAmount)
        submitData.append("ghsAmount", calculateGHS(formData.rmbAmount))
      }
      submitData.append("exchangeRate", exchangeRate?.toString() || "0")
      submitData.append("email", formData.email)
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
          rmbAmount: formData.currencyMode === "ghs-to-rmb" ? calculateRMB(formData.ghsAmount) : formData.rmbAmount,
          ghsAmount: formData.currencyMode === "rmb-to-ghs" ? calculateGHS(formData.rmbAmount) : formData.ghsAmount,
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-purple-400 to-purple-600 py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 w-full max-w-2xl flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="TRADE RMB Logo" className="w-12 h-12 object-contain mb-2" />
          <span className="text-2xl font-extrabold text-blue-700 tracking-tight mb-2">TRADE RMB</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-purple-700 mb-2 text-center">RMB Purchase Form</h2>
        <p className="text-gray-500 mb-8 text-center max-w-lg">Fill in your details to buy Chinese Yuan with Ghana Cedis</p>
        
        <form onSubmit={handleSubmit} className="w-full">
          {/* Two-column layout for desktop */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column - Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
              
              <div>
                <label className="text-gray-900 font-semibold mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={e => handleInputChange("fullName", e.target.value)}
                  required
                  className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.fullName && <div className="text-red-600 text-xs mt-1">{errors.fullName}</div>}
              </div>

              <div>
                <label className="text-gray-900 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={e => handleInputChange("email", e.target.value)}
                  required
                  className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.email && <div className="text-red-600 text-xs mt-1">{errors.email}</div>}
              </div>

              <div>
                <label className="text-gray-900 font-semibold mb-1">Mobile Money Number *</label>
                <input
                  type="tel"
                  placeholder="e.g., 0241234567"
                  value={formData.mobileNumber}
                  onChange={e => handleInputChange("mobileNumber", e.target.value)}
                  required
                  className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.mobileNumber && <div className="text-red-600 text-xs mt-1">{errors.mobileNumber}</div>}
              </div>

              <div>
                <label className="text-gray-900 font-semibold mb-1">Referral Name <span className="text-gray-400">(Optional)</span></label>
                <input
                  type="text"
                  placeholder="Who referred you?"
                  value={formData.referralName}
                  onChange={e => handleInputChange("referralName", e.target.value)}
                  className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {errors.referralName && <div className="text-red-600 text-xs mt-1">{errors.referralName}</div>}
              </div>
            </div>

            {/* Right Column - Transaction Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Transaction Details</h3>
              
              <div>
                <label className="text-gray-900 font-semibold mb-2 block">Currency Mode *</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputChange("currencyMode", "ghs-to-rmb")}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      formData.currencyMode === "ghs-to-rmb"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ₵ → ¥ (GHS to RMB)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange("currencyMode", "rmb-to-ghs")}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                      formData.currencyMode === "rmb-to-ghs"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ¥ → ₵ (RMB to GHS)
                  </button>
                </div>
                {errors.currencyMode && <div className="text-red-600 text-xs mt-1">{errors.currencyMode}</div>}
              </div>

              {formData.currencyMode === "ghs-to-rmb" ? (
                <div>
                  <label className="text-gray-900 font-semibold mb-1">Amount in GHS *</label>
                  <input
                    type="number"
                    placeholder="Amount in GHS"
                    value={formData.ghsAmount}
                    onChange={e => handleInputChange("ghsAmount", e.target.value)}
                    required
                    min="1"
                    className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.ghsAmount && <div className="text-red-600 text-xs mt-1">{errors.ghsAmount}</div>}
                  {exchangeRate && formData.ghsAmount && (
                    <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 p-4 mt-3">
                      <div className="flex items-center mb-2">
                        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-gray-700 font-semibold">You will receive:</span>
                        <span className="ml-auto text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">¥{calculateRMB(formData.ghsAmount)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Exchange Rate: 1 GHS = {exchangeRate.toFixed(2)} RMB
                        {currentRateType && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {currentRateType === "standard" ? "Standard" : "Low RMB"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-gray-900 font-semibold mb-1">Amount in RMB *</label>
                  <input
                    type="number"
                    placeholder="Amount in RMB"
                    value={formData.rmbAmount}
                    onChange={e => handleInputChange("rmbAmount", e.target.value)}
                    required
                    min="1"
                    className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  {errors.rmbAmount && <div className="text-red-600 text-xs mt-1">{errors.rmbAmount}</div>}
                  {exchangeRate && formData.rmbAmount && (
                    <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 p-4 mt-3">
                      <div className="flex items-center mb-2">
                        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-gray-700 font-semibold">You will pay:</span>
                        <span className="ml-auto text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GHS {calculateGHS(formData.rmbAmount)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Exchange Rate: 1 RMB = {(1/exchangeRate).toFixed(4)} GHS
                        {currentRateType && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            {currentRateType === "standard" ? "Standard" : "Low RMB"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-gray-900 font-semibold mb-1">Upload Alipay QR Code *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleInputChange("alipayQR", e.target.files?.[0] || null)}
                  required
                  className="border rounded-lg w-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {qrPreview && (
                  <img src={qrPreview} alt="QR Preview" className="w-24 h-24 object-contain rounded border mx-auto mt-2" />
                )}
                {errors.alipayQR && <div className="text-red-600 text-xs mt-1">{errors.alipayQR}</div>}
              </div>
            </div>
          </div>

          {/* Submit Button - Full Width */}
          <div className="w-full mt-8">
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl px-6 py-4 font-bold text-lg shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Submit & Pay"}
            </button>
            {Object.values(errors).some(Boolean) && (
              <div className="text-red-600 text-sm text-center mt-2">Please fix the errors above.</div>
            )}
          </div>
        </form>
        
        <a href="/" className="mt-6 text-gray-400 text-xs hover:underline">&larr; Back to Home</a>
      </div>
      
      {/* Testimonials Section - Responsive */}
      <div className="w-full max-w-2xl mt-8">
        <div className="bg-white/90 rounded-2xl shadow p-6">
          <h3 className="text-lg font-bold text-purple-700 mb-2 text-center">What Customers Say</h3>
          <div className="text-gray-700 italic text-center mb-2">"{testimonials[currentTestimonial].text}"</div>
          <div className="text-sm text-gray-500 text-center">— {testimonials[currentTestimonial].name}, {testimonials[currentTestimonial].location}</div>
        </div>
      </div>

      {/* Low RMB Modal */}
      <Modal
        isOpen={showLowRmbModal}
        onClose={() => setShowLowRmbModal(false)}
        title="Different Exchange Rate"
        message="Note: Orders below ¥1000 use a different exchange rate."
        rate={lowRmbRate}
      />
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
