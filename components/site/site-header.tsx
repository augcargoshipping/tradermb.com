"use client"

import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { Menu, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  onBuy?: () => void
  className?: string
}

export function SiteHeader({ onBuy, className }: SiteHeaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const logoTapCount = useRef(0)
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const authHref = session?.user ? "/dashboard" : "/auth/signin"
  const authLabel = session?.user ? "Dashboard" : "Sign in"

  const handleLogoTap = () => {
    setOpen(false)
    logoTapCount.current += 1
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current)

    if (logoTapCount.current >= 3) {
      logoTapCount.current = 0
      router.push("/admin/orders")
      return
    }

    logoTapTimer.current = setTimeout(() => {
      if (logoTapCount.current === 1) {
        router.push("/")
      }
      logoTapCount.current = 0
    }, 900)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-emerald-100/80 bg-white/95 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl safe-top",
        className
      )}
    >
      <div className="container-tight section-pad flex h-14 sm:h-16 items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleLogoTap}
          className="flex min-w-0 items-center gap-2.5 rounded-lg text-left transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Trade RMB home"
        >
          <Image
            src="/logo-nav.png?v=3"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
            priority
          />
          <span className="font-display truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">
            Trade RMB
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild className="min-h-[40px]">
            <Link href={authHref}>
              <User className="mr-1.5 h-4 w-4" />
              {authLabel}
            </Link>
          </Button>
          {onBuy ? (
            <button type="button" onClick={onBuy} className="btn-primary text-sm">
              Buy RMB
            </button>
          ) : (
            <Link href="/purchase" className="btn-primary text-sm">
              Buy RMB
            </Link>
          )}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-4 pb-4 pt-3 sm:hidden">
          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild className="min-h-[44px] w-full justify-center">
              <Link href={authHref} onClick={() => setOpen(false)}>
                <User className="mr-2 h-4 w-4" />
                {authLabel}
              </Link>
            </Button>
            {onBuy ? (
              <button type="button" className="btn-primary w-full" onClick={() => { setOpen(false); onBuy() }}>
                Buy RMB
              </button>
            ) : (
              <Link href="/purchase" className="btn-primary w-full text-center" onClick={() => setOpen(false)}>
                Buy RMB
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
