"use client"

import { useState, useRef, useEffect } from 'react'
import { PlayCircle, PauseCircle, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

export function VideoPlayer({ src, poster, className }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [isControlsVisible, setIsControlsVisible] = useState(false)
  const videoRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    // Update duration once metadata is loaded
    const handleLoadedMetadata = () => {
      setDuration(videoRef.current.duration)
    }

    const video = videoRef.current
    if (video) {
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      
      // Set volume initially
      video.volume = volume
      video.muted = isMuted
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [volume, isMuted])

  // Update time as video plays
  useEffect(() => {
    const video = videoRef.current
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }
    
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate)
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
      }
    }
  }, [])

  // Auto-hide controls after inactivity
  useEffect(() => {
    if (isControlsVisible) {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setIsControlsVisible(false)
      }, 3000)
    }
    
    return () => {
      clearTimeout(timerRef.current)
    }
  }, [isControlsVisible])

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = ([newVolume]) => {
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    if (newVolume === 0) {
      setIsMuted(true)
      videoRef.current.muted = true
    } else if (isMuted) {
      setIsMuted(false)
      videoRef.current.muted = false
    }
  }

  const handleSeek = ([newTime]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }

  const showControls = () => {
    setIsControlsVisible(true)
  }

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
  }

  return (
    <div 
      className={cn("relative aspect-video group rounded-lg overflow-hidden bg-black", className)}
      onMouseMove={showControls}
      onMouseLeave={() => setIsControlsVisible(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Play/Pause Overlay Button */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-16 w-16 rounded-full bg-black/30 text-white hover:bg-black/50"
            onClick={togglePlay}
          >
            <PlayCircle className="h-10 w-10" />
          </Button>
        </div>
      )}
      
      {/* Controls */}
      <div className={cn(
        "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-2 transition-opacity",
        isControlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress Bar */}
        <div className="mb-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>
        
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={togglePlay}>
              {isPlaying ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={toggleMute}>
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
              <div className="w-20">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="cursor-pointer"
                />
              </div>
            </div>
            
            <span className="text-xs">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white" onClick={toggleFullscreen}>
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}