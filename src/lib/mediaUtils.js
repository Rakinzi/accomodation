// src/lib/mediaUtils.js
import fs from 'fs/promises'
import path from 'path'

/**
 * Utility functions for handling media uploads
 */

/**
 * Maximum allowed file sizes in bytes
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Allowed file types
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

/**
 * Validate a file is within the allowed size and type constraints
 * @param {File} file - The file to validate
 * @param {string} mediaType - 'image' or 'video'
 * @returns {Object} - { valid: boolean, error: string | null }
 */
export const validateFile = (file, mediaType = 'image') => {
  // Check file type
  const allowedTypes = mediaType === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_IMAGE_TYPES
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types are: ${allowedTypes.join(', ')}`
    }
  }

  // Check file size
  const maxSize = mediaType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size for ${mediaType}s is ${formatFileSize(maxSize)}`
    }
  }

  return { valid: true, error: null }
}

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "5.2 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Ensures that the required upload directories exist
 * @returns {Promise<boolean>} - true if directories exist or were created successfully
 */
export const ensureUploadDirectories = async () => {
  try {
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'properties')
    const imgDir = path.join(baseDir, 'images')
    const videoDir = path.join(baseDir, 'videos')

    // Check if base directory exists
    try {
      await fs.access(baseDir)
    } catch (error) {
      // Create base directory if it doesn't exist
      await fs.mkdir(baseDir, { recursive: true })
    }

    // Check and create images directory
    try {
      await fs.access(imgDir)
    } catch (error) {
      await fs.mkdir(imgDir, { recursive: true })
    }

    // Check and create videos directory
    try {
      await fs.access(videoDir)
    } catch (error) {
      await fs.mkdir(videoDir, { recursive: true })
    }

    return true
  } catch (error) {
    console.error('Error ensuring upload directories:', error)
    return false
  }
}

/**
 * Safely generates a filename from original name
 * @param {string} originalName - Original file name
 * @returns {string} - Sanitized filename with timestamp
 */
export const generateSafeFilename = (originalName) => {
  // Remove unsafe characters
  const safeFileName = originalName.replace(/[^a-zA-Z0-9.]/g, '')
  
  // Add timestamp to prevent conflicts
  const timestamp = Date.now()
  
  return `${timestamp}-${safeFileName}`
}

/**
 * Get appropriate media URL path based on type
 * @param {string} filename - Filename
 * @param {string} mediaType - 'image' or 'video'
 * @returns {string} - URL path to media
 */
export const getMediaUrl = (filename, mediaType = 'image') => {
  const folder = mediaType === 'video' ? 'videos' : 'images'
  return `/uploads/properties/${folder}/${filename}`
}

/**
 * Check if file exists and returns stats
 * @param {string} filepath - Full file path
 * @returns {Promise<Object|null>} - File stats or null if file doesn't exist
 */
export const getFileInfo = async (filepath) => {
  try {
    const stats = await fs.stat(filepath)
    return stats
  } catch (error) {
    return null
  }
}

/**
 * Detect media type from MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} - 'image', 'video', or 'unknown'
 */
export const detectMediaType = (mimeType) => {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return 'image'
  } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
    return 'video'
  } else {
    return 'unknown'
  }
}