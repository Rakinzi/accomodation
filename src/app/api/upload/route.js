// src/app/api/upload/route.js
import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import path from "path"

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
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'properties', folder)
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error
      }
    }
    
    const filePath = join(uploadDir, filename)
    
    await writeFile(filePath, buffer)
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

// Handle DELETE requests to remove uploaded files
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Get the filename from the URL
    const url = new URL(request.url)
    const pathname = url.pathname
    const parts = pathname.split('/')
    const filename = parts[parts.length - 1]
    const folder = parts[parts.length - 2] // 'images' or 'videos'
    
    if (!filename || !folder) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    
    // Validate the folder is either 'images' or 'videos'
    if (folder !== 'images' && folder !== 'videos') {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }
    
    // Security check: ensure filename only contains safe characters
    if (!/^[a-zA-Z0-9-_.]+$/.test(filename)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }
    
    const filePath = join(process.cwd(), 'public', 'uploads', 'properties', folder, filename)
    
    const fs = require('fs/promises')
    await fs.unlink(filePath)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}