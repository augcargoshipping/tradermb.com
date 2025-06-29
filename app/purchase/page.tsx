"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, Calculator, ChevronLeft, ChevronRight } from "lucide-react"

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
          if (data.fallback) {
            console.log("⚠️ Using fallback rate:", data.message)
          }
        } else {
          console.error("❌ Failed to load rate:", data.error)
          // Fallback to mock rate
          setExchangeRate(1.85)
        }
      } catch (err) {
        console.error("❌ Failed to load rate", err)
        // Fallback to mock rate
        setExchangeRate(1.85)
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

    if (!formData.alipayQR) {
      newErrors.alipayQR = "Please upload your Alipay QR code"
    }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Light Logo Background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32">
          <img src="/logo.png" alt="" className="w-full h-full object-contain opacity-20" />
        </div>
        <div className="absolute top-40 right-20 w-24 h-24">
          <img src="/logo.png" alt="" className="w-full h-full object-contain opacity-15" />
        </div>
        <div className="absolute bottom-20 left-1/4 w-28 h-28">
          <img src="/logo.png" alt="" className="w-full h-full object-contain opacity-10" />
        </div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="mr-3">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight text-red-700 drop-shadow select-none">TRADE RMB</h1>
              <p className="text-sm text-gray-600">Purchase Chinese Yuan</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="bg-white rounded-lg shadow-md px-3 py-2 border border-gray-200">
              <p className="text-xs text-gray-500 font-medium">Current Rate</p>
              <p className="text-sm font-bold text-green-700">
                {loadingRate ? "Loading..." : exchangeRate ? `1 GHS = ${exchangeRate.toFixed(2)} RMB` : "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        <Card className="shadow-xl bg-white rounded-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-900">RMB Purchase Form</CardTitle>
            <CardDescription className="text-gray-600">
              Fill in your details to buy Chinese Yuan with Ghana Cedis
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full-name">Customer Full Name *</Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className={`${errors.fullName ? "border-red-500" : "border-gray-300"} rounded-lg`}
                  disabled={isSubmitting}
                />
                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile-number">Mobile Money Number *</Label>
                <Input
                  id="mobile-number"
                  type="tel"
                  placeholder="e.g., 0241234567"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  className={`${errors.mobileNumber ? "border-red-500" : "border-gray-300"} rounded-lg`}
                  disabled={isSubmitting}
                />
                {errors.mobileNumber && <p className="text-sm text-red-500">{errors.mobileNumber}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referral-name">Referral Name <span className="text-gray-400">(Optional)</span></Label>
                <Input
                  id="referral-name"
                  type="text"
                  placeholder="Who referred you?"
                  value={formData.referralName}
                  onChange={(e) => handleInputChange("referralName", e.target.value)}
                  className="border-gray-300 rounded-lg"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ghs-amount">Amount in GHS *</Label>
                <Input
                  id="ghs-amount"
                  type="number"
                  placeholder="Enter amount in Ghana Cedis"
                  value={formData.ghsAmount}
                  onChange={(e) => handleInputChange("ghsAmount", e.target.value)}
                  className={`${errors.ghsAmount ? "border-red-500" : "border-gray-300"} rounded-lg`}
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
                {errors.ghsAmount && <p className="text-sm text-red-500">{errors.ghsAmount}</p>}

                {formData.ghsAmount && Number.parseFloat(formData.ghsAmount) > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">You will receive:</span>
                      </div>
                      <span className="text-xl font-bold text-green-700">
                        {loadingRate ? "Loading..." : exchangeRate ? `¥${calculateRMB(formData.ghsAmount)}` : "Rate unavailable"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Exchange Rate: 1 GHS = {loadingRate ? "Loading..." : exchangeRate ? `${exchangeRate.toFixed(2)}` : "Unavailable"} RMB
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="alipay-qr">Upload Alipay QR Code *</Label>
                <div className="relative">
                  <Input
                    id="alipay-qr"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInputChange("alipayQR", e.target.files?.[0] || null)}
                    className={`${errors.alipayQR ? "border-red-500" : "border-gray-300"} rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
                    disabled={isSubmitting}
                  />
                  <Upload className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                </div>
                {errors.alipayQR && <p className="text-sm text-red-500">{errors.alipayQR}</p>}

                {formData.alipayQR && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-green-700 font-medium">✓ QR Code Selected</p>
                      <button
                        type="button"
                        onClick={() => handleInputChange("alipayQR", null)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={isSubmitting}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      {qrPreview && (
                        <img
                          src={qrPreview}
                          alt="QR Code Preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                      )}
                      <div>
                        <p className="text-xs text-gray-600">{formData.alipayQR.name}</p>
                        <p className="text-xs text-gray-500">{(formData.alipayQR.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-3 rounded-lg text-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit & Pay"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Testimonials Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">What Our Customers Say</h3>
          
          <div className="relative">
            {/* Testimonial Display */}
            <div className="text-center mb-4">
              <div className="flex justify-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < testimonials[currentTestimonial].rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 italic text-sm leading-relaxed mb-3">
                "{testimonials[currentTestimonial].text}"
              </p>
              <div className="text-sm">
                <span className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</span>
                <span className="text-gray-500"> • {testimonials[currentTestimonial].location}</span>
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center space-x-2 mb-4">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Join {testimonials.length * 100}+ satisfied customers who trust TRADE RMB
            </p>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img 
              src="/logo.png" 
              alt="TRADE RMB Logo" 
              className="w-6 h-6 object-contain opacity-70"
            />
            <span className="font-semibold text-gray-600">TRADE RMB</span>
          </div>
          <p>Secure • Fast • Reliable</p>
          <p className="mt-1">© 2025 TRADE RMB. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default function PurchasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>}>
      <PurchaseForm />
    </Suspense>
  )
}
