import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Providers from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RMB TRADE - Buy Chinese Yuan with Ghana Cedis",
  description:
    "Fast, easy & secure currency exchange from Ghana Cedis to Chinese Yuan (RMB). Best exchange rates guaranteed.",
  keywords: "RMB, Chinese Yuan, Ghana Cedis, currency exchange, mobile money, MTN, Vodafone, AirtelTigo",
  authors: [{ name: "RMB TRADE" }],
  generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
          {children}
        </Providers>
      </body>
    </html>
  )
}
