"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { CarouselApi } from "@/components/ui/carousel"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

const HERO_SLIDES = [
  {
    src: "/hero-exchange.png",
    alt: "Secure Ghana Cedis to Chinese Yuan exchange",
  },
  {
    src: "/hero-slide-1.png",
    alt: "Exchange Ghana Cedis for Chinese Yuan",
  },
  {
    src: "/hero-slide-2.png",
    alt: "Pay with mobile money, receive RMB on Alipay",
  },
  {
    src: "/hero-slide-3.png",
    alt: "Fast settlement in minutes",
  },
  {
    src: "/hero-slide-4.png",
    alt: "Secure and tracked every trade",
  },
] as const

const AUTOPLAY_MS = 5000

export function HeroSlideshow({ className }: { className?: string }) {
  const [api, setApi] = useState<CarouselApi>()
  const [active, setActive] = useState(0)

  const onSelect = useCallback(() => {
    if (!api) return
    setActive(api.selectedScrollSnap())
  }, [api])

  useEffect(() => {
    if (!api) return
    onSelect()
    api.on("select", onSelect)
    return () => {
      api.off("select", onSelect)
    }
  }, [api, onSelect])

  useEffect(() => {
    if (!api) return
    const id = setInterval(() => {
      if (api.canScrollNext()) api.scrollNext()
      else api.scrollTo(0)
    }, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [api])

  return (
    <div
      className={cn(
        "relative w-full max-w-[min(100%,320px)] sm:max-w-[420px] lg:max-w-[520px]",
        className
      )}
    >
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "center" }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {HERO_SLIDES.map((slide, index) => (
            <CarouselItem key={slide.src} className="pl-0">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white/40">
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className="object-contain"
                  priority={index === 0}
                  unoptimized
                  sizes="(max-width: 640px) 320px, (max-width: 1024px) 420px, 520px"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <button
          type="button"
          onClick={() => api?.scrollPrev()}
          className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-emerald-800 shadow-md transition hover:bg-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => api?.scrollNext()}
          className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 bg-white/90 text-emerald-800 shadow-md transition hover:bg-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </Carousel>

      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Hero slides">
        {HERO_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => api?.scrollTo(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              active === index ? "w-6 bg-emerald-600" : "w-2 bg-emerald-300/80 hover:bg-emerald-400"
            )}
          />
        ))}
      </div>
    </div>
  )
}
