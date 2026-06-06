import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Trade RMB — Temporarily closed",
  description: "Trade RMB is temporarily closed. We will be back soon.",
  robots: { index: false, follow: false },
}

export default function SiteClosedPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/40 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm">
        <Image
          src="/logo-nav.png?v=3"
          alt="Trade RMB"
          width={56}
          height={56}
          className="mx-auto h-14 w-14 object-contain"
          priority
        />
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-slate-900">
          Temporarily closed
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Trade RMB is paused for now while we make improvements. Thank you for your
          patience — we&apos;ll be back soon.
        </p>
        <p className="mt-6 text-xs text-slate-400">
          Questions? Contact us on WhatsApp at{" "}
          <span className="font-medium text-emerald-700">0594669717</span>
        </p>
      </div>
    </div>
  )
}
