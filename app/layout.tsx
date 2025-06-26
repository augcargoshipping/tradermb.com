import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "./providers"
import { useSession } from "next-auth/react"
import GreetingBanner from "./components/GreetingBanner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RMB TRADE - Buy Chinese Yuan with Ghana Cedis",
  description:
    "Fast, easy & secure currency exchange from Ghana Cedis to Chinese Yuan (RMB). Best exchange rates guaranteed.",
  keywords: "RMB, Chinese Yuan, Ghana Cedis, currency exchange, mobile money, MTN, Vodafone, AirtelTigo",
  authors: [{ name: "RMB TRADE" }],
  viewport: "width=device-width, initial-scale=1",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <GreetingBanner />
          {children}
        </Providers>
      </body>
    </html>
  )
}
