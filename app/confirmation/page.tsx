"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Copy, ArrowLeft, Smartphone, Clock, Users } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"

interface SubmissionData {
  fullName: string
  mobileNumber: string
  referralName: string
  ghsAmount: string
  rmbAmount: string
  referenceCode: string
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
  const { toast } = useToast();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Get submission data from sessionStorage
    const storedData = sessionStorage.getItem("submissionData")
    if (storedData) {
      setSubmissionData(JSON.parse(storedData))
    } else {
      // Redirect to home if no data
      router.push("/")
    }
  }, [router])

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Submitted!</h1>
          <p className="text-gray-600">Your RMB purchase request has been received</p>
        </div>

        {/* Payment Instructions */}
        <Card className="shadow-xl bg-white rounded-2xl mb-6">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-900 flex items-center justify-center">
              <Smartphone className="w-6 h-6 mr-2 text-green-600" />
              Payment Instructions
            </CardTitle>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            <div className="space-y-6">
              {/* Mobile Money Payment Method */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Smartphone className="w-6 h-6 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Mobile Money Payment</h3>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-300">
                  <p className="text-sm font-medium text-gray-700 mb-2">Send payment to:</p>
                  <p className="text-2xl font-bold text-orange-600 text-center">0597384360</p>
                  <p className="text-sm text-gray-600 text-center mt-1">(MTN Mobile Money)</p>
                  <p className="text-sm font-medium text-gray-700 text-center mt-2">Food Source Limited</p>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-2">Important:</p>
                  <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Use reference code: <strong>{submissionData.referenceCode}</strong></li>
                    <li>Send exactly GHS {submissionData.ghsAmount}</li>
                    <li>Keep your payment receipt</li>
                    <li><strong>⚠️ Use the same mobile money number ({submissionData.mobileNumber}) that you entered in the form</strong></li>
                  </ul>
                </div>
              </div>

              {/* In-Person Payment Option */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Prefer to Pay in Person?</h3>
                <p className="text-sm text-gray-700 mb-3">
                  You can visit our office to pay in person. Please bring a valid ID card and your reference code.
                </p>
                <Button
                  onClick={() => {
                    const message = encodeURIComponent(
                      `Hello, I am a customer from TRADE RMB and I want to pay in person. My reference code is: ${submissionData.referenceCode}`
                    );
                    const whatsappUrl = `https://wa.me/233597384360?text=${message}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="bg-red-700 hover:bg-red-800 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center mx-auto"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  Chat on WhatsApp to Book In-Person Payment
                </Button>
              </div>

              {/* Reference Code */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Your Reference Code:</p>
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-yellow-300">
                  <span className="text-2xl font-bold text-yellow-700 font-mono">{submissionData.referenceCode}</span>
                  <Button onClick={handleCopyReference} variant="outline" size="sm" className="ml-2">
                    {copied ? <CheckCircle className="w-4 h-4 text-red-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-yellow-700 mt-2 font-medium">
                  ⚠️ You MUST use this reference when making payment
                </p>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Transaction Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">{submissionData.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mobile Number:</span>
                    <span className="font-medium">{submissionData.mobileNumber}</span>
                  </div>
                  {submissionData.referralName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Referred by:</span>
                      <span className="font-medium">{submissionData.referralName}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount to Pay:</span>
                      <span className="font-bold text-red-600">GHS {submissionData.ghsAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">You'll Receive:</span>
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
          className="mb-6"
        >
          <div className="bg-white border border-blue-200 rounded-2xl shadow-xl text-center p-6">
            <div className="flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Refer & Earn</h2>
            </div>
            <p className="text-gray-700 mb-4 text-sm">
              While you wait, invite friends to TRADE RMB and earn cash rewards!
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition cursor-pointer"
              onClick={handleReferralClick}
            >
              Start Referring Now
            </motion.div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleNewTransaction}
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 rounded-lg"
          >
            Make Another Transaction
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Need help? Contact our support team</p>
          <Button
            onClick={() => {
              const userName = session?.user?.name || "a customer";
              const message = encodeURIComponent(`Hello Trade RMB support! This is ${userName}.`)
              const whatsappUrl = `https://wa.me/233597384360?text=${message}`
              window.open(whatsappUrl, '_blank')
            }}
            className="mt-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center mx-auto"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
            </svg>
            Chat on WhatsApp
          </Button>
        </div>
      </div>

      {/* Referral Modal */}
      {showReferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-blue-200 relative flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-blue-800">Share Your Referral Link</h3>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={handleWhatsApp} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                WhatsApp
              </button>
              <button onClick={handleSMS} className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-2">
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
