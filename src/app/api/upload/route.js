// src/app/api/upload/route.js
import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file type
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    
    if (!isVideo && !isImage) {
      return NextResponse.json({ error: "Invalid file type. Only images and videos are allowed." }, { status: 400 })
    }

    // Check file size
    // Videos can be up to 50MB, images up to 5MB
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. ${isVideo ? 'Videos' : 'Images'} must be under ${maxSize / (1024 * 1024)}MB`
      }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Use timestamp to prevent filename conflicts
    const timestamp = Date.now()
    // Clean the filename to remove unsafe characters
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '')
    const filename = `${timestamp}-${originalName}`
    
    // Create path for the correct media type
    const folder = isVideo ? 'videos' : 'images'
    const uploadFolder = join(process.cwd(), 'public', 'uploads', 'properties', folder)
    const path = join(uploadFolder, filename)
    
    await writeFile(path, buffer)
    const url = `/uploads/properties/${folder}/${filename}`

    return NextResponse.json({
      url,
      type: isVideo ? 'video' : 'image',
      name: originalName
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}