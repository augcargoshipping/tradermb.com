import { SiteHeader } from "@/components/site/site-header"
import { SiteFooter } from "@/components/site/site-footer"

/** Visible shell while homepage client bundle loads — avoids blank gradient-only screen. */
export function HomePageFallback() {
  return (
    <div className="page-shell hero-gradient">
      <SiteHeader />
      <div className="border-b border-emerald-300/40 bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-center text-sm font-semibold text-white">
        Loading Trade RMB…
      </div>
      <main className="flex-1">
        <section className="container-tight section-pad py-12 sm:py-16">
          <div className="glass-card p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Ghana → China</p>
            <h1 className="mt-4 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Pay with MoMo, get <span className="text-gradient-brand">RMB on Alipay</span>
            </h1>
            <p className="mt-4 text-muted-foreground">Send Cedis, receive Yuan — live rates and tracked orders.</p>
            <div className="mt-6 h-12 w-48 animate-pulse rounded-xl bg-emerald-100" />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
