"use client"

import { useDropzone } from "react-dropzone"
import { ImageIcon, X } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"


export async function uploadImage(file) {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || "Upload failed")
  }

  const data = await response.json()
  return {
    url: data.url,
    preview: data.url
  }
}

export function ImageUpload({ value = [], onChange, maxFiles = 5 }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")

  const onDrop = async (acceptedFiles) => {
    try {
      setIsUploading(true)
      setError("")
      
      const uploadPromises = acceptedFiles.map(uploadImage)
      const newImages = await Promise.all(uploadPromises)
      
      onChange([...value, ...newImages].slice(0, maxFiles))
    } catch (error) {
      setError(error.message)
      console.error("Upload failed:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxFiles - value.length,
    disabled: isUploading,
    onDrop
  })

  const removeImage = async (indexToRemove) => {
    const imageToRemove = value[indexToRemove]
    const filename = imageToRemove.url.split('/').pop()

    try {
      await fetch(`/api/upload/${filename}`, {
        method: 'DELETE'
      })
      
      onChange(value.filter((_, index) => index !== indexToRemove))
    } catch (error) {
      console.error("Failed to delete image:", error)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors",
          isDragActive 
            ? "border-sky-500 bg-sky-500/10" 
            : "border-zinc-200 hover:border-sky-500/50 dark:border-zinc-800",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="p-3 bg-zinc-100 rounded-lg dark:bg-zinc-900">
            <ImageIcon className="h-6 w-6 text-zinc-500" />
          </div>
          <div className="text-sm text-zinc-500">
            {isUploading ? "Uploading..." : (
              <>
                <span className="font-medium">Click to upload</span> or drag and drop
              </>
            )}
          </div>
          <div className="text-xs text-zinc-500">
            Up to {maxFiles} images (PNG, JPG, WEBP)
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {value.map((image, index) => (
            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden">
              <Image
                src={image.preview || image.url}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}