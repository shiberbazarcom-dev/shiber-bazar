/**
 * compressImage.js
 * Client-side image compression using Canvas API.
 * Reduces large photos to ~100-300 KB before uploading to Supabase storage.
 * No external libraries needed — uses built-in browser Canvas.
 *
 * Usage:
 *   import { compressImage } from '../lib/compressImage'
 *   const compressed = await compressImage(file)   // returns a File
 *   await supabase.storage.from('bucket').upload(path, compressed)
 */

const MAX_WIDTH  = 1200   // px — max output dimension
const MAX_HEIGHT = 1200
const QUALITY    = 0.82   // JPEG quality (0–1). 0.82 ≈ good visual quality, ~60-80% size reduction

/**
 * Compress an image File/Blob.
 * Non-image files (PDF, DOCX, etc.) are returned as-is with only a size check.
 *
 * @param {File} file
 * @param {{ maxWidth?: number, maxHeight?: number, quality?: number }} options
 * @returns {Promise<File>}  compressed File with original name preserved
 */
export async function compressImage(
  file,
  { maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT, quality = QUALITY } = {}
) {
  // Only compress image types
  if (!file.type.startsWith('image/')) return file
  // Skip SVG (vector, no pixel benefit)
  if (file.type === 'image/svg+xml') return file

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Calculate dimensions preserving aspect ratio
      let { width, height } = img
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      // White background for images with transparency (PNG → JPEG)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)

      // Output format: JPEG for photos (smallest), PNG only if input is PNG and transparent
      const outputType = file.type === 'image/png' ? 'image/jpeg' : (file.type || 'image/jpeg')

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          // If compressed is larger than original (rare edge case), keep original
          const result = blob.size < file.size ? blob : file
          const ext    = outputType === 'image/jpeg' ? 'jpg' : file.name.split('.').pop()
          const name   = file.name.replace(/\.[^.]+$/, `.${ext}`)
          resolve(new File([result], name, { type: outputType }))
        },
        outputType,
        quality
      )
    }

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) } // fallback: use original
    img.src = url
  })
}

/**
 * Validate file size (call before compressImage for non-images like PDFs).
 * @param {File} file
 * @param {number} maxMB — default 5 MB
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateFileSize(file, maxMB = 5) {
  const maxBytes = maxMB * 1024 * 1024
  if (file.size > maxBytes) {
    return {
      ok: false,
      message: `ফাইলের সাইজ সর্বোচ্চ ${maxMB}MB হতে হবে। আপনার ফাইল: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
    }
  }
  return { ok: true }
}
