"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, ShieldCheck, Zap, User, LogOut, Menu, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GreetingBanner from "./components/GreetingBanner"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSession } from "next-auth/react"

function LandingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const isMobile = useIsMobile();
  const [navShadow, setNavShadow] = useState(false);
  const { data: session } = useSession();
  const [rate, setRate] = useState<number | null>(null);
  const [rateError, setRateError] = useState<string | null>(null);
  const [rateLoading, setRateLoading] = useState(true);

  // Handle referral parameter from URL
  useEffect(() => {
    if (searchParams) {
      const ref = searchParams.get('ref');
      if (ref) {
        const decodedRef = decodeURIComponent(ref);
        setUserName(decodedRef);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    let interval: NodeJS.Timeout;
    async function loadRate() {
      try {
        setRateLoading(true);
        setRateError(null);
        const response = await fetch("/api/fetch-rate");
        const data = await response.json();
        if (isMounted) {
          if (data.success) {
            if (data.rates) {
              // New format: rates object with standard and lowRmb
              const standardRate = data.rates.standard;
              if (standardRate !== null) {
                setRate(standardRate);
                setRateError(null);
              } else {
                setRate(null);
                setRateError("No standard rate available");
              }
            } else if (data.rate !== null) {
              // Legacy format: single rate
              setRate(data.rate);
              setRateError(null);
            } else {
              setRate(null);
              setRateError("No rate available");
            }
          } else {
            setRate(null);
            setRateError(data.error || "Failed to load rate");
          }
        }
      } catch (error) {
        if (isMounted) {
          setRate(null);
          setRateError("Failed to load rate");
        }
      } finally {
        if (isMounted) setRateLoading(false);
      }
    }
    loadRate();
    // Poll every 60 seconds for freshness
    interval = setInterval(loadRate, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    }
  }, []);

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

  const [showReferModal, setShowReferModal] = useState(false);

  const handleReferralClick = () => {
    if (session && session.user) {
      setShowReferModal(true);
    } else {
      router.push("/auth/signin");
    }
  }

  const handleCopyLink = () => {
    if (session && session.user) {
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(session.user.name)}`;
      navigator.clipboard.writeText(referralLink);
      toast && toast({ title: "Referral link copied!", description: "Share it with your friends." });
    }
  };

  const handleWhatsApp = () => {
    if (session && session.user) {
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(session.user.name)}`;
      const message = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
      window.open(`https://wa.me/?text=${message}`, "_blank");
    }
  };

  const handleSMS = () => {
    if (session && session.user) {
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(session.user.name)}`;
      const message = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
      window.open(`sms:?&body=${message}`);
    }
  };

  const handleEmail = () => {
    if (session && session.user) {
      const referralLink = `${window.location.origin}/auth/signup?referrer=${encodeURIComponent(session.user.name)}`;
      const subject = encodeURIComponent("Join me on TRADE RMB!");
      const body = encodeURIComponent(`Hey! Check out TRADE RMB for fast and secure RMB trades. Use my link to sign up: ${referralLink}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const handleAuthClick = () => {
    if (session && session.user) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className={`sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 transition-shadow duration-300 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 ${navShadow ? 'shadow-lg' : 'shadow-none'}`} id="main-navbar">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Custom Logo */}
            <img 
              src="/logo.png" 
              alt="TRADE RMB Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-base sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight drop-shadow select-none">TRADE RMB</span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex flex-1 justify-end items-center space-x-3 lg:space-x-4">
            <Button
              onClick={handleAuthClick}
              variant="outline"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
            >
              <User className="h-4 w-4" />
              <span>{session && session.user ? "Dashboard" : "Sign In"}</span>
            </Button>
            <Button
              onClick={handleBuyRMB}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-4 sm:px-6 lg:px-8 py-2 sm:py-3 rounded-xl text-base sm:text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minWidth: '120px' }}
            >
              <span className="text-base sm:text-lg font-bold tracking-wide">BUY RMB</span>
            </Button>
          </div>

          {/* Mobile Navigation - Direct Buttons */}
          <div className="flex sm:hidden items-center space-x-2">
            <Button
              onClick={handleAuthClick}
              variant="outline"
              size="sm"
              className="flex items-center space-x-1 text-gray-700 hover:text-gray-900 text-xs"
            >
              <User className="h-3 w-3" />
              <span>{session && session.user ? "Dashboard" : "Sign In"}</span>
            </Button>
            <Button
              onClick={handleBuyRMB}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-3 py-2 rounded-lg text-xs shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minWidth: '80px' }}
            >
              <span className="font-bold tracking-wide">BUY RMB</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Rate Display at Top */}
      <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 border-b border-blue-200 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {rateLoading ? (
            <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm sm:text-lg px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg animate-pulse">
              Loading Rate...
            </span>
          ) : rateError ? (
            <span className="inline-block bg-red-500 text-white font-bold text-sm sm:text-lg px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg">
              {rateError}
            </span>
          ) : rate !== null ? (
            <span className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm sm:text-lg px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]"></div>
              <span className="relative z-10">Today's Rate: 1 RMB = {rate.toFixed(2)} GHS</span>
            </span>
          ) : null}
        </div>
      </div>

      {/* Greeting Banner */}
      {userName && (
        <div className="w-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-center py-3 font-semibold text-base shadow-sm">
          Hello {userName}, you are welcome
        </div>
      )}

      {/* Hero Section */}
      <section className="relative flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 gap-10 lg:gap-16">
        {/* Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full lg:w-1/2 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12 text-center lg:text-left border border-white/20"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Buy <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chinese Yuan</span> Instantly
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 mb-8 leading-relaxed">
            The fastest, most secure way to buy Chinese Yuan (RMB) with Ghana Cedis. Enjoy unbeatable rates, instant funding, and total peace of mind.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleBuyRMB}
              className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-4 rounded-xl text-lg shadow-lg hover:scale-105 hover:shadow-2xl transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              style={{ minWidth: '160px' }}
            >
              <span className="text-base sm:text-lg font-bold tracking-wide">Get Started</span>
            </Button>
            <Button
              onClick={handleAuthClick}
              variant="outline"
              className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-bold px-8 py-4 rounded-xl text-lg transition-all duration-200 flex items-center justify-center"
            >
              <span className="text-base sm:text-lg font-bold tracking-wide">
                {session && session.user ? "Dashboard" : "Sign In"}
              </span>
            </Button>
          </div>
        </motion.div>
        {/* Modern Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full lg:w-1/2 flex flex-col items-center"
        >
          <motion.img
            src="/hero-illustration.png"
            alt="Payment Transfer Illustration"
            className="max-w-[250px] sm:max-w-[300px] lg:max-w-[350px] xl:max-w-[400px]"
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
        </motion.div>
      </section>

      {/* New Text Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8 lg:mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Paying</span> Securely & Swiftly
          </h2>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-gray-900 leading-tight mt-2">
            with the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Best Rates</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mt-6 max-w-3xl mx-auto leading-relaxed">
            Experience transparent pricing, bank-level security, and real-time rate locking—so you always get the most value for your money.
          </p>
        </motion.div>
        
        {/* Payment Method Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center items-center space-x-8 lg:space-x-12 xl:space-x-16 mb-8 lg:mb-12"
        >
          {/* Alipay Logo */}
          <motion.div 
            whileHover={{ 
              scale: 1.1,
              rotate: 2,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/alipay_logo.svg" 
              alt="Alipay" 
              className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 object-contain"
            />
          </motion.div>
          
          {/* WeChat Logo */}
          <motion.div 
            whileHover={{ 
              scale: 1.1,
              rotate: -2,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <img 
              src="/wechat_logo.png" 
              alt="WeChat" 
              className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 object-contain"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 py-8 lg:py-16 px-4 sm:px-6 lg:px-8"
      >
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <CardContent className="p-8 lg:p-10 text-center flex flex-col items-center">
            <Zap className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">Instant Funding</h3>
            <p className="text-gray-600 text-base lg:text-lg">Your RMB is delivered to your account within minutes, 24/7.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <CardContent className="p-8 lg:p-10 text-center flex flex-col items-center">
            <ShieldCheck className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">Safe & Secure</h3>
            <p className="text-gray-600 text-base lg:text-lg">Your funds and data are protected with industry-leading security.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 rounded-2xl">
          <CardContent className="p-8 lg:p-10 text-center flex flex-col items-center">
            <Users className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl lg:text-2xl font-semibold text-gray-900 mb-3">Trusted by Many</h3>
            <p className="text-gray-600 text-base lg:text-lg">Hundreds of happy customers rely on TRADE RMB for their currency needs.</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral Section */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="max-w-4xl mx-auto mb-8 lg:mb-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="bg-white/90 backdrop-blur-sm border border-blue-200 rounded-3xl shadow-xl text-center p-8 lg:p-12">
          <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Refer & Earn</h2>
          <p className="text-gray-700 text-base lg:text-lg mb-6">
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
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 px-4 mb-8 md:mb-12">
        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 flex flex-col justify-center"
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">What Our Customers Say</h3>
          <div className="space-y-4 md:space-y-6">
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
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 flex flex-col justify-center"
        >
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 text-center">Frequently Asked Questions</h3>
          <div className="space-y-3 md:space-y-4">
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
      <div className="text-center mt-6 md:mt-8 text-sm text-gray-500">
        <p>Need help? Contact our support team</p>
        <Button
          onClick={() => {
            const userName = session?.user?.name || "a customer";
            const message = encodeURIComponent(`Hello Trade RMB support! This is ${userName}.`);
            const whatsappUrl = `https://wa.me/233597384360?text=${message}`;
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

      {/* Footer */}
      <footer className="text-center text-gray-500 py-6 md:py-8">
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
