import type React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { getServerSession } from "next-auth"
import "./globals.css"
import Providers from "./providers"
import { authOptions } from "@/lib/auth-options"

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Trade RMB — GHS to Chinese Yuan, fast & secure",
  description:
    "Exchange Ghana Cedis for Chinese Yuan (RMB) with live rates, mobile money, and fast settlement.",
  keywords: "RMB, Chinese Yuan, Ghana Cedis, GHS, currency exchange, Trade RMB, Alipay",
  appleWebApp: {
    capable: true,
    title: "Trade RMB",
    statusBarStyle: "default",
  },
  icons: {
    apple: "/logo-nav.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={sans.variable}>
      <body className="min-h-[100dvh] bg-[hsl(210,40%,98%)] font-sans text-slate-900 antialiased [--font-display:var(--font-sans)]">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
