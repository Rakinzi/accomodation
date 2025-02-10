"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Carousel({ images, interval = 5000 }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-slide effect
  useEffect(() => {
    if (!isHovered && images.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((current) => 
          current === images.length - 1 ? 0 : current + 1
        )
      }, interval)

      return () => clearInterval(timer)
    }
  }, [images.length, interval, isHovered])

  const handlePrevious = () => {
    setCurrentIndex((current) => 
      current === 0 ? images.length - 1 : current - 1
    )
  }

  const handleNext = () => {
    setCurrentIndex((current) => 
      current === images.length - 1 ? 0 : current + 1
    )
  }

  if (!images?.length) {
    return (
      <div className="relative w-full h-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
        <p className="text-zinc-500">No images available</p>
      </div>
    )
  }

  return (
    <div 
      className="relative w-full h-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Current Image */}
      <div className="relative w-full h-full">
        <Image
          src={images[currentIndex].url}
          alt={`Property image ${currentIndex + 1}`}
          fill
          className="object-cover"
          priority={currentIndex === 0}
        />
      </div>

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentIndex === index
                  ? "bg-white w-4"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}