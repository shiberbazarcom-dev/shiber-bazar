#!/usr/bin/env node
/**
 * PWA Icon Generator for শিবের বাজার
 * Run once: node scripts/make-icons.cjs
 * Creates public/icon-192.png and public/icon-512.png
 * No npm packages needed — uses only Node.js built-ins
 */

const zlib = require('node:zlib')
const fs   = require('node:fs')
const path = require('node:path')

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
  return (crc ^ 0xFFFFFFFF) >>> 0
}

// ── PNG chunk builder ──────────────────────────────────────────────────────
function chunk(type, data) {
  const t    = Buffer.from(type, 'ascii')
  const len  = Buffer.alloc(4);  len.writeUInt32BE(data.length)
  const body = Buffer.concat([t, data])
  const crc  = Buffer.alloc(4);  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

// ── Pixel renderer ────────────────────────────────────────────────────────
// Draws a rounded-rectangle icon on an RGB pixel buffer
function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 3)

  // Brand colours
  const BG  = [37,  99,  235]  // #2563EB blue
  const FG  = [255, 255, 255]  // white (for the inner mark)
  const radius = Math.round(size * 0.22)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 3

      // Rounded-rect clipping (corner test)
      const cx = Math.min(x, size - 1 - x)
      const cy = Math.min(y, size - 1 - y)
      if (cx < radius && cy < radius) {
        const dx = radius - cx - 1
        const dy = radius - cy - 1
        if (dx * dx + dy * dy > radius * radius) {
          // outside — transparent (white bg on icon)
          pixels[idx] = pixels[idx+1] = pixels[idx+2] = 255
          continue
        }
      }

      // Blue background
      pixels[idx]   = BG[0]
      pixels[idx+1] = BG[1]
      pixels[idx+2] = BG[2]

      // Simple "শ" glyph approximated as a white cross/mark in the centre
      // (Centre square so it's legible at 192px and 512px)
      const cx2 = x - size / 2
      const cy2 = y - size / 2
      const hw = size * 0.18   // half-width of stroke
      const arm = size * 0.30  // arm length

      const inH = Math.abs(cy2) < hw && Math.abs(cx2) < arm   // horizontal bar
      const inV = Math.abs(cx2) < hw && cy2 > -arm && cy2 < arm * 0.6  // vertical bar
      // Bottom serif bumps
      const bumpL = Math.abs(cx2 + arm * 0.55) < hw * 0.7 && cy2 > arm * 0.1 && cy2 < arm * 0.55
      const bumpR = Math.abs(cx2 - arm * 0.55) < hw * 0.7 && cy2 > arm * 0.1 && cy2 < arm * 0.55

      if (inH || inV || bumpL || bumpR) {
        pixels[idx]   = FG[0]
        pixels[idx+1] = FG[1]
        pixels[idx+2] = FG[2]
      }
    }
  }
  return pixels
}

// ── PNG encoder ────────────────────────────────────────────────────────────
function encodePNG(size, pixels) {
  const IHDR = Buffer.alloc(13)
  IHDR.writeUInt32BE(size, 0)
  IHDR.writeUInt32BE(size, 4)
  IHDR[8] = 8   // bit depth
  IHDR[9] = 2   // colour type: RGB
  // rest are 0: deflate, adaptive filter, no interlace

  // Add filter byte (0 = None) before every scanline
  const raw = Buffer.alloc(size * (1 + size * 3))
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0  // filter: None
    pixels.copy(raw, y * (1 + size * 3) + 1, y * size * 3, (y + 1) * size * 3)
  }

  const IDAT = zlib.deflateSync(raw, { level: 9 })

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),  // PNG signature
    chunk('IHDR', IHDR),
    chunk('IDAT', IDAT),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ── Main ───────────────────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public')

for (const size of [192, 512]) {
  const pixels = renderIcon(size)
  const png    = encodePNG(size, pixels)
  const file   = path.join(outDir, `icon-${size}.png`)
  fs.writeFileSync(file, png)
  console.log(`✅  public/icon-${size}.png  (${(png.length / 1024).toFixed(1)} KB)`)
}

console.log('\nDone! Icons ready for PWA.')
