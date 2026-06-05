import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-slate-300 safe-bottom">
      <div className="absolute inset-0 mesh-dots opacity-20" aria-hidden />
      <div className="container-tight section-pad relative py-12 sm:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Image src="/logo-nav.png?v=3" alt="" width={44} height={44} className="h-11 w-11 object-contain" />
              <p className="font-display text-xl font-bold text-white">Trade RMB</p>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Fast, transparent GHS → RMB exchange for importers, businesses, and individuals across Ghana.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Trade</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/purchase" className="transition hover:text-white">
                  Start a trade
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="transition hover:text-white">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-white">
                  My dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Support</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href="https://wa.me/233270373565"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  WhatsApp support
                </a>
              </li>
              <li className="text-slate-500">Mon – Sun · responsive hours</li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Trade RMB. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
