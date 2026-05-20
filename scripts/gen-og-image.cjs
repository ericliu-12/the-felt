// Generates public/og-image.png (1200x630) using only Node built-ins.
// Run: node scripts/gen-og-image.js
const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

const W = 1200, H = 630
const BG   = [0x0d, 0x0d, 0x0d]
const GOLD = [0xc9, 0xa8, 0x4c]
const BLK  = [0x00, 0x00, 0x00]

const px = Buffer.alloc(W * H * 3)
for (let i = 0; i < W * H; i++) { px[i*3]=BG[0]; px[i*3+1]=BG[1]; px[i*3+2]=BG[2] }

function setpx(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return
  const i = (y * W + x) * 3
  px[i] = c[0]; px[i+1] = c[1]; px[i+2] = c[2]
}

// --- Poker chip ---
const CX = W / 2, CY = H / 2 - 30
const R_OUT = 230, R_GAP = 184, R_IN = 154
const NOTCH = 4 // half-width in degrees

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const dx = x - CX, dy = y - CY
    const d = Math.hypot(dx, dy)
    if (d > R_OUT) continue
    let c
    if (d <= R_IN) {
      c = GOLD
    } else if (d <= R_GAP) {
      c = BLK
    } else {
      const a = ((Math.atan2(dy, dx) * 180 / Math.PI) % 45 + 45) % 45
      c = (a < NOTCH || a > 45 - NOTCH) ? BLK : GOLD
    }
    setpx(x, y, c)
  }
}

// --- Bitmap font (5 wide × 7 tall) ---
const FONT = {
  T: [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  H: [0b10001,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  E: [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  F: [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
  L: [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
  ' ':[0,0,0,0,0,0,0],
}

const SCALE = 8
const CHAR_W = 5 * SCALE
const CHAR_H = 7 * SCALE
const GAP    = SCALE

const text   = 'THE FELT'
const TW     = text.length * CHAR_W + (text.length - 1) * GAP
const TX     = Math.round((W - TW) / 2)
const TY     = CY + R_OUT + 36

for (let ci = 0; ci < text.length; ci++) {
  const rows = FONT[text[ci]]
  const ox = TX + ci * (CHAR_W + GAP)
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if (!(rows[row] & (1 << (4 - col)))) continue
      for (let sy = 0; sy < SCALE; sy++)
        for (let sx = 0; sx < SCALE; sx++)
          setpx(ox + col * SCALE + sx, TY + row * SCALE + sy, GOLD)
    }
  }
}

// --- PNG encode ---
function chunk(type, data) {
  const t = Buffer.from(type)
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length)
  const crc = Buffer.allocUnsafe(4); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crc])
}

const ihdr = Buffer.allocUnsafe(13)
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4)
ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0

const raw = Buffer.allocUnsafe(H * (1 + W * 3))
for (let y = 0; y < H; y++) {
  raw[y * (1 + W*3)] = 0 // filter None
  px.copy(raw, y*(1+W*3)+1, y*W*3, (y+1)*W*3)
}

const png = Buffer.concat([
  Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
  chunk('IEND', Buffer.alloc(0)),
])

const out = path.join(__dirname, '../public/og-image.png')
fs.writeFileSync(out, png)
console.log(`Wrote ${out} (${(png.length/1024).toFixed(1)} KB)`)
