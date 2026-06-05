"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Smartphone, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface ExchangeData {
  ghsAmount: string
  fullName: string
  momoNumber: string
  rmb_amount: string
  alipayQR: string | null
  alipayQRName: string | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const [exchangeData, setExchangeData] = useState<ExchangeData | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "processing" | "success" | "failed">("pending")
  const [countdown, setCountdown] = useState(300) // 5 minutes countdown
  const [exchangeRate, setExchangeRate] = useState<number | null>(null)
  const [loadingRate, setLoadingRate] = useState(true)

  useEffect(() => {
    // Get data from sessionStorage
    const storedData = sessionStorage.getItem("exchangeData")
    if (storedData) {
      setExchangeData(JSON.parse(storedData))
    } else {
      // Redirect back if no data
      router.push("/")
    }
  }, [router])

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
  }, [])

  useEffect(() => {
    // Countdown timer
    if (paymentStatus === "pending" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown, paymentStatus])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleMoMoPayment = async () => {
    setPaymentStatus("processing")

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // For demo purposes, randomly succeed or fail
      const success = Math.random() > 0.3 // 70% success rate

      if (success) {
        setPaymentStatus("success")
        // Clear stored data
        sessionStorage.removeItem("exchangeData")
      } else {
        setPaymentStatus("failed")
      }
    } catch (error) {
      console.error("Payment error:", error)
      setPaymentStatus("failed")
    }
  }

  const handleGoBack = () => {
    router.push("/")
  }

  if (!exchangeData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="mr-3">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <p className="text-sm text-gray-600">Complete your exchange</p>
          </div>
        </div>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{exchangeData.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mobile Number:</span>
              <span className="font-medium">{exchangeData.momoNumber}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">Amount to Pay:</span>
              <span className="font-bold text-green-700">GHS {exchangeData.ghsAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">You'll Receive:</span>
              <span className="font-bold text-blue-700">¥{exchangeData.rmb_amount}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Rate:</strong> 1 GHS = {loadingRate ? "Loading..." : exchangeRate ? `${exchangeRate.toFixed(2)}` : "Unavailable"} RMB
              </p>
            </div>

            {/* Display uploaded QR Code */}
            {exchangeData.alipayQR && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Alipay QR Code:</strong>
                </p>
                <div className="flex items-center space-x-3">
                  <img
                    src={exchangeData.alipayQR || "/placeholder.svg"}
                    alt="Uploaded Alipay QR Code"
                    className="w-16 h-16 object-cover rounded border"
                  />
                  <div>
                    <p className="text-xs text-gray-600">{exchangeData.alipayQRName}</p>
                    <p className="text-xs text-green-600">✓ Ready for transfer</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Status */}
        {paymentStatus === "pending" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="mr-2 h-5 w-5" />
                Mobile Money Payment
              </CardTitle>
              <CardDescription>Pay with your mobile money to complete the exchange</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-orange-800">Time remaining: {formatTime(countdown)}</span>
                </div>
                <p className="text-sm text-orange-700">
                  Complete payment within the time limit to secure your exchange rate.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  You will receive a prompt on your phone to authorize the payment of{" "}
                  <strong>GHS {exchangeData.ghsAmount}</strong>
                </p>

                <Button
                  onClick={handleMoMoPayment}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3"
                >
                  Pay with Mobile Money
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === "processing" && (
          <Card className="mb-6">
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please check your phone and authorize the payment...</p>
              <Badge variant="secondary" className="mt-3">
                Processing
              </Badge>
            </CardContent>
          </Card>
        )}

        {paymentStatus === "success" && (
          <Card className="mb-6 border-green-200">
            <CardContent className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-4">Your exchange has been completed successfully.</p>
              <Badge variant="default" className="bg-green-600">
                Completed
              </Badge>
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Next Steps:</strong> Your RMB will be transferred to your Alipay account within 24 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentStatus === "failed" && (
          <Card className="mb-6 border-red-200">
            <CardContent className="text-center py-8">
              <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-800 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-4">There was an issue processing your payment. Please try again.</p>
              <Badge variant="destructive">Failed</Badge>
              <Button onClick={() => setPaymentStatus("pending")} className="w-full mt-4" variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Support Info */}
        <Card>
          <CardContent className="text-center py-4">
            <p className="text-sm text-gray-600">Need help? Contact our support team</p>
            <p className="text-sm font-medium text-blue-600 mt-1">+233 59 456 3368</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
