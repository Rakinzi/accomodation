"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function Carousel({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const prev = () => setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1))

  if (!images?.length) return null

  return (
    <div className="relative h-full w-full">
      <Image
        src={images[currentIndex].url}
        alt={`Property image ${currentIndex + 1}`}
        fill
        className="object-cover"
      />
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/80"
            onClick={prev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white/80"
            onClick={next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
            {images.map((_, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className={`h-2 w-2 rounded-full ${
                  index === currentIndex ? "bg-white" : "bg-white/50"
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}