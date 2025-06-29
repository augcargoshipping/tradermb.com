"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, ShieldCheck, Zap, User, LogOut } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSession, signOut } from "next-auth/react"
import GreetingBanner from "./components/GreetingBanner"

function LandingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [rate, setRate] = useState<number | null>(null)
  const [loadingRate, setLoadingRate] = useState(true)
  const [navShadow, setNavShadow] = useState(false)
  const { toast } = useToast();
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralName, setReferralName] = useState("");
  const [userName, setUserName] = useState("");

  // Handle referral parameter from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      const decodedRef = decodeURIComponent(ref);
      setReferralName(decodedRef);
      setUserName(decodedRef);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    
    async function loadRate() {
      try {
        console.log("🔍 Loading rate from API...")
        const response = await fetch("/api/fetch-rate")
        const data = await response.json()
        console.log("📊 API response:", data)
        
        if (isMounted) {
          if (data.success && data.rate !== null) {
            console.log("✅ Setting rate to:", data.rate)
            setRate(data.rate)
          } else {
            console.error("❌ Failed to load rate:", data.error)
            setRate(null)
          }
          setLoadingRate(false)
        }
      } catch (error) {
        console.error("❌ Failed to load rate:", error)
        if (isMounted) {
          setRate(null)
          setLoadingRate(false)
        }
      }
    }
    
    loadRate()
    
    return () => {
      isMounted = false;
    }
  }, []) // Empty dependency array to run only once

  useEffect(() => {
    const handleScroll = () => {
      setNavShadow(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleBuyRMB = () => {
    router.push("/purchase")
  }

  const handleReferralClick = () => {
    if (session) {
      // If user is signed in, show referral modal
      setShowReferralModal(true);
    } else {
      // If user is not signed in, redirect to sign in
      router.push("/auth/signin");
    }
  }

  const handleReferralSubmit = async () => {
    if (!referralName.trim()) {
      toast({ 
        title: "Name required", 
        description: "Please enter your full name to continue",
        variant: "destructive"
      });
      return;
    }

    setUserName(referralName);
    setShowReferralModal(false);
    
    const currentDomain = window.location.origin;
    const url = `${currentDomain}?ref=${encodeURIComponent(referralName)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "TRADE RMB Referral",
          text: `Join TRADE RMB and get unbeatable rates! Use my referral link:`,
          url,
        });
        toast({ title: "Referral link shared!" });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ 
        title: "Referral link copied!", 
        description: url 
      });
    }
  }

  const handleAuthClick = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className={`sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200 transition-shadow duration-300 px-4 sm:px-6 py-3 sm:py-4 ${navShadow ? 'shadow-lg' : 'shadow-none'}`} id="main-navbar">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Custom Logo */}
            <img 
              src="/logo.png" 
              alt="TRADE RMB Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-lg sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight drop-shadow select-none">TRADE RMB</span>
          </div>
          <div className="flex-1 flex justify-end items-center space-x-2">
            {session ? (
              <>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="hidden sm:flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <User className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleAuthClick}
                variant="outline"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
            <Button
              onClick={handleBuyRMB}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-4 sm:px-6 py-2 sm:py-3 rounded-xl text-base sm:text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minWidth: '120px' }}
            >
              <span className="text-base sm:text-lg font-bold tracking-wide">BUY RMB</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Rate Display at Top */}
      <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 border-b border-blue-200 py-2">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm sm:text-lg px-3 sm:px-6 py-1 sm:py-2 rounded-full shadow-sm">
            {loadingRate ? "Loading Rate..." : rate !== null ? `Current Rate: 1 GHS = ${rate} RMB` : "Rate Unavailable"}
          </span>
        </div>
      </div>

      {/* Greeting Banner */}
      {userName && (
        <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-center py-2 font-semibold text-base shadow-sm">
          Hello {userName}, you are welcome
        </div>
      )}

      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto px-6 py-16 gap-10">
        {/* Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full md:w-1/2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 text-center md:text-left border border-white/20"
        >
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
            Exchange <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">GHS to RMB</span> Instantly
          </h1>
          <p className="text-base md:text-lg text-gray-700 mb-8">
            The fastest, most secure way to buy Chinese Yuan (RMB) with Ghana Cedis. Enjoy unbeatable rates, instant funding, and total peace of mind.
          </p>
          <Button
            onClick={handleBuyRMB}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-transform duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{ minWidth: '140px' }}
          >
            <span className="text-base sm:text-lg font-bold tracking-wide">Get Started</span>
          </Button>
        </motion.div>
        {/* Modern Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full md:w-1/2 flex flex-col items-center"
        >
          <motion.img
            src="/hero-illustration.png"
            alt="Payment Transfer Illustration"
            className="max-w-[200px] md:max-w-[250px]"
            style={{ objectFit: 'contain' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ 
              scale: 1.05,
              rotate: 2,
              transition: { duration: 0.3 }
            }}
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-center text-gray-600 mt-6 text-sm md:text-base max-w-md"
          >
            Secure • Fast • Reliable
          </motion.p>
        </motion.div>
      </section>

        {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-12 px-4"
      >
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <Zap className="w-10 h-10 text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant Funding</h3>
            <p className="text-gray-600">Your RMB is delivered to your account within minutes, 24/7.</p>
            </CardContent>
          </Card>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <ShieldCheck className="w-10 h-10 text-purple-600 mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Safe & Secure</h3>
            <p className="text-gray-600">Your funds and data are protected with industry-leading security.</p>
            </CardContent>
          </Card>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-8 text-center flex flex-col items-center">
            <Users className="w-10 h-10 text-blue-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Trusted by Many</h3>
            <p className="text-gray-600">Hundreds of happy customers rely on TRADE RMB for their currency needs.</p>
            </CardContent>
          </Card>
      </motion.div>

      {/* Referral Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="max-w-2xl mx-auto mb-16"
      >
        <div className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-2xl shadow-xl text-center p-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Refer & Earn</h2>
          <p className="text-gray-700 mb-3">
            Invite your friends to TRADE RMB and earn cash rewards for every successful referral.
          </p>
          <motion.div
            whileHover={{ scale: 1.07 }}
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:from-blue-700 hover:to-purple-700 transition cursor-pointer"
            onClick={handleReferralClick}
          >
            Start Referring Now
          </motion.div>
        </div>
      </motion.div>

      {/* Testimonials & FAQ Section */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-16">
        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex flex-col justify-center"
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">What Our Customers Say</h3>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-400 pl-4 py-2">
              <p className="text-gray-800 italic">"Super fast and reliable! My RMB was funded in minutes. Highly recommend."</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="font-semibold text-blue-600">— Nana A., Accra</span>
              </div>
</div>
            <div className="border-l-4 border-purple-400 pl-4 py-2">
              <p className="text-gray-800 italic">"Great rates and excellent support. I felt safe throughout the process."</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="font-semibold text-purple-600">— Linda M., Kumasi</span>
        </div>
      </div>
            <div className="border-l-4 border-blue-400 pl-4 py-2">
              <p className="text-gray-800 italic">"The referral bonus is a nice touch. I've already told my friends!"</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="font-semibold text-blue-600">— Kwame B., Tamale</span>
              </div>
            </div>
          </div>
        </motion.div>
        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex flex-col justify-center"
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {/* FAQ Accordion */}
            <details className="group border-b pb-2">
              <summary className="font-semibold cursor-pointer text-gray-800 group-open:text-blue-700 transition">How long does it take to receive RMB?</summary>
              <p className="mt-2 text-gray-600 text-sm">Most transfers are completed within minutes, 24/7. In rare cases, it may take up to 1 hour.</p>
            </details>
            <details className="group border-b pb-2">
              <summary className="font-semibold cursor-pointer text-gray-800 group-open:text-blue-700 transition">Is my money safe?</summary>
              <p className="mt-2 text-gray-600 text-sm">Yes! We use secure payment channels and never share your data. Your funds are protected at every step.</p>
            </details>
            <details className="group border-b pb-2">
              <summary className="font-semibold cursor-pointer text-gray-800 group-open:text-blue-700 transition">Can I refer friends?</summary>
              <p className="mt-2 text-gray-600 text-sm">Absolutely! Use your referral link to invite friends and earn cash rewards for every successful transaction.</p>
            </details>
            <details className="group">
              <summary className="font-semibold cursor-pointer text-gray-800 group-open:text-blue-700 transition">What payment methods do you accept?</summary>
              <p className="mt-2 text-gray-600 text-sm">We accept all major Ghanaian mobile money networks (MTN, Vodafone, AirtelTigo) and in-person payments at our office.</p>
            </details>
          </div>
        </motion.div>
      </div>

      {/* Support Info */}
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>Need help? Contact our support team</p>
        <Button
          onClick={() => {
            const message = encodeURIComponent("Hello, I am a customer from TRADE RMB and i need some help with...");
            const whatsappUrl = `https://wa.me/233594563368?text=${message}`;
            window.open(whatsappUrl, '_blank');
          }}
          className="mt-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center mx-auto"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
          Chat on WhatsApp
        </Button>
        </div>

      {/* Footer */}
      <footer className="text-center text-gray-500 py-8">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <img 
            src="/logo.png" 
            alt="TRADE RMB Logo" 
            className="w-8 h-8 object-contain opacity-70"
          />
          <span className="font-semibold text-gray-600">TRADE RMB</span>
        </div>
        <p>Secure • Fast • Reliable</p>
        <p className="mt-1">© {new Date().getFullYear()} TRADE RMB. All rights reserved.</p>
      </footer>

      {/* Referral Name Modal */}
      <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
        <DialogContent className="max-w-xs sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Enter Your Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="referral-name">Full Name</Label>
              <Input
                id="referral-name"
                type="text"
                placeholder="Enter your full name"
                value={referralName}
                onChange={(e) => setReferralName(e.target.value)}
                className="mt-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleReferralSubmit();
                  }
                }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">
              This name will be used in your referral link
            </p>
          </div>
          <DialogFooter className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowReferralModal(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReferralSubmit}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Create Referral Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandingPageContent />
    </Suspense>
  )
}
