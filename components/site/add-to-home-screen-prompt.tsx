"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Bookmark, PlusSquare, Share, Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const DISMISS_KEY = "tradeRmbInstallPromptDismissed"
const DISMISS_MS = 14 * 24 * 60 * 60 * 1000

type InstallMode = "ios" | "android" | "desktop"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

function wasDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return false
    const ts = Number(raw)
    return !Number.isNaN(ts) && Date.now() - ts < DISMISS_MS
  } catch {
    return false
  }
}

export function AddToHomeScreenPrompt() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<InstallMode>("desktop")
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      /* ignore */
    }
    setOpen(false)
  }, [])

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return
    if (pathname?.startsWith("/auth") || pathname?.startsWith("/admin")) return

    let showTimer: ReturnType<typeof setTimeout> | undefined

    const onInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      setMode("android")
      showTimer = setTimeout(() => setOpen(true), 2000)
    }

    window.addEventListener("beforeinstallprompt", onInstallPrompt)

    if (isIOS()) {
      setMode("ios")
      showTimer = setTimeout(() => setOpen(true), 3000)
    } else if (!isMobile()) {
      setMode("desktop")
      showTimer = setTimeout(() => setOpen(true), 5000)
    } else {
      setMode("android")
      showTimer = setTimeout(() => setOpen(true), 3500)
    }

    return () => {
      if (showTimer) clearTimeout(showTimer)
      window.removeEventListener("beforeinstallprompt", onInstallPrompt)
    }
  }, [pathname])

  const handleInstall = async () => {
    if (!installEvent) return
    setInstalling(true)
    try {
      await installEvent.prompt()
      await installEvent.userChoice
      dismiss()
    } catch {
      /* user cancelled or browser blocked */
    } finally {
      setInstalling(false)
      setInstallEvent(null)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-5 shadow-xl safe-bottom sm:p-6">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <Image src="/logo-nav.png?v=3" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
          <div>
            <h2 id="install-prompt-title" className="text-lg font-bold text-gray-900">
              Save Trade RMB
            </h2>
            <p className="text-sm text-gray-500">Quick access from your home screen or bookmarks</p>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-700">
          {mode === "ios" && (
            <>
              <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-900">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
                Add this site to your iPhone home screen for one-tap access.
              </p>
              <ol className="list-decimal space-y-2 pl-5 text-gray-600">
                <li>
                  Tap <Share className="inline h-4 w-4 text-blue-600" /> <strong>Share</strong> in Safari
                </li>
                <li>
                  Scroll and tap <PlusSquare className="inline h-4 w-4 text-gray-700" />{" "}
                  <strong>Add to Home Screen</strong>
                </li>
                <li>Tap <strong>Add</strong> — you&apos;re done!</li>
              </ol>
            </>
          )}

          {mode === "android" && (
            <>
              <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-900">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
                Install Trade RMB on your phone for faster access next time.
              </p>
              {installEvent ? (
                <p className="text-gray-600">Tap the button below to add the app to your home screen.</p>
              ) : (
                <ol className="list-decimal space-y-2 pl-5 text-gray-600">
                  <li>
                    Open your browser menu <span className="font-medium">(⋮)</span>
                  </li>
                  <li>
                    Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>
                  </li>
                  <li>Confirm to add Trade RMB</li>
                </ol>
              )}
            </>
          )}

          {mode === "desktop" && (
            <>
              <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-900">
                <Bookmark className="mt-0.5 h-4 w-4 shrink-0" />
                Bookmark this page to return quickly without signing in again.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>
                  <strong>Windows:</strong> Press <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">Ctrl</kbd>{" "}
                  + <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">D</kbd>
                </li>
                <li>
                  <strong>Mac:</strong> Press <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">⌘</kbd>{" "}
                  + <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-xs">D</kbd>
                </li>
                <li>
                  Or click the <Bookmark className="inline h-3.5 w-3.5" /> star in your browser&apos;s address bar
                </li>
              </ul>
            </>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {mode === "android" && installEvent && (
            <Button
              type="button"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleInstall()}
              disabled={installing}
            >
              {installing ? "Adding…" : "Add to Home Screen"}
            </Button>
          )}
          <Button
            type="button"
            variant={mode === "android" && installEvent ? "outline" : "default"}
            className={
              mode === "android" && installEvent
                ? "w-full"
                : "w-full bg-emerald-600 hover:bg-emerald-700"
            }
            onClick={dismiss}
          >
            Got it
          </Button>
          <Button type="button" variant="ghost" className="w-full text-gray-500" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  )
}
