"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { PlusSquare, Share, Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const SEEN_KEY = "tradeRmbAddToHomeSeen"
const LEGACY_DISMISS_KEY = "tradeRmbInstallPromptDismissed"

type PhoneMode = "ios" | "android"

function isInstallPreview(): boolean {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).get("install-preview") === "1"
}

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

function detectPhone(): PhoneMode | null {
  if (typeof navigator === "undefined") return null
  const ua = navigator.userAgent || ""
  const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
  // iPhone, iPad, iPod, and Chrome/Firefox on iOS (CriOS / FxiOS still include iPhone)
  if (/iPad|iPhone|iPod/.test(ua) || iPadOs) return "ios"
  if (/Android/i.test(ua)) return "android"
  return null
}

function hasSeenPrompt(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === "1" || Boolean(localStorage.getItem(LEGACY_DISMISS_KEY))
  } catch {
    return true
  }
}

function markPromptSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, "1")
  } catch {
    /* ignore */
  }
}

function IosSteps() {
  return (
    <div className="space-y-2">
      <p className="flex items-start gap-2 text-emerald-900">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
        On iPhone or iPad (Safari):
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-gray-600">
        <li>
          Tap <Share className="inline h-4 w-4 text-blue-600" /> <strong>Share</strong>
        </li>
        <li>
          Tap <PlusSquare className="inline h-4 w-4" /> <strong>Add to Home Screen</strong>
        </li>
        <li>
          Tap <strong>Add</strong>
        </li>
      </ol>
    </div>
  )
}

function AndroidSteps() {
  return (
    <div className="space-y-2">
      <p className="flex items-start gap-2 text-emerald-900">
        <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
        On Android (Chrome):
      </p>
      <ol className="list-decimal space-y-1 pl-5 text-gray-600">
        <li>
          Tap the <strong>⋮</strong> menu at the top right
        </li>
        <li>
          Tap <strong>Add to Home screen</strong> or <strong>Install app</strong>
        </li>
        <li>
          Tap <strong>Add</strong>
        </li>
      </ol>
    </div>
  )
}

export function AddToHomeScreenPrompt() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<PhoneMode>("ios")
  const [canSwitchPreview, setCanSwitchPreview] = useState(false)
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)

  const close = useCallback(() => {
    if (!isInstallPreview()) markPromptSeen()
    setOpen(false)
  }, [])

  useEffect(() => {
    const preview = isInstallPreview()
    if (pathname !== "/" && !preview) return
    if (!preview && (isStandalone() || hasSeenPrompt())) return

    const detected = detectPhone()
    if (!detected && !preview) return

    setMode(detected ?? "ios")
    setCanSwitchPreview(preview && !detected)

    const onInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      if (!detected) setMode("android")
    }
    window.addEventListener("beforeinstallprompt", onInstallPrompt)

    const showTimer = setTimeout(() => {
      if (!preview && (hasSeenPrompt() || isStandalone())) return
      if (!preview) markPromptSeen()
      setOpen(true)
    }, preview ? 200 : 1800)

    return () => {
      clearTimeout(showTimer)
      window.removeEventListener("beforeinstallprompt", onInstallPrompt)
    }
  }, [pathname])

  const handleInstall = async () => {
    if (!installEvent) return
    setInstalling(true)
    try {
      await installEvent.prompt()
      await installEvent.userChoice
      close()
    } catch {
      /* cancelled */
    } finally {
      setInstalling(false)
      setInstallEvent(null)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 pointer-events-none"
      role="dialog"
      aria-labelledby="install-prompt-title"
      aria-modal="false"
    >
      <div className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-4 shadow-lg safe-bottom sm:p-5">
        <button
          type="button"
          onClick={close}
          className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 pr-8">
          <Image src="/logo-nav.png?v=5" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <h2 id="install-prompt-title" className="text-base font-bold text-gray-900">
              Add Trade RMB to your home screen
            </h2>
            <p className="text-xs text-gray-500">Opens like an app next time — this tip shows once.</p>
          </div>
        </div>

        {canSwitchPreview ? (
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-semibold",
                mode === "ios" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
              onClick={() => setMode("ios")}
            >
              iPhone
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-semibold",
                mode === "android" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
              onClick={() => setMode("android")}
            >
              Android
            </button>
          </div>
        ) : null}

        <div className="mt-3 text-sm text-gray-700">
          {mode === "ios" ? <IosSteps /> : <AndroidSteps />}
        </div>

        <div className="mt-4 flex gap-2">
          {mode === "android" && installEvent ? (
            <Button
              type="button"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void handleInstall()}
              disabled={installing}
            >
              {installing ? "Adding…" : "Add to Home Screen"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="flex-1" onClick={close}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
