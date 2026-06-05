/**
 * Legacy: converts dark-background public/logo.png → public/logo-nav.png.
 * New logos are generated with a transparent background; use logo.png + logo-nav.png
 * directly, or run: npm run logo:process only if your source has a solid dark bg.
 */
import sharp from "sharp"

const BG_LUM_MAX = 4
const TARGET_R = 30
const TARGET_G = 64
const TARGET_B = 175

async function main() {
  const inputPath = "public/logo.png"
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const ch = 4
  const out = Buffer.from(data)

  const lumAt = (i: number) => (data[i] + data[i + 1] + data[i + 2]) / 3
  const isBg = (i: number) => lumAt(i) <= BG_LUM_MAX

  const visited = new Uint8Array(w * h)
  const queue: number[] = []

  const trySeed = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return
    const p = y * w + x
    if (visited[p]) return
    const i = p * ch
    if (!isBg(i)) return
    visited[p] = 1
    queue.push(p)
  }

  for (let x = 0; x < w; x++) {
    trySeed(x, 0)
    trySeed(x, h - 1)
  }
  for (let y = 0; y < h; y++) {
    trySeed(0, y)
    trySeed(w - 1, y)
  }

  let head = 0
  while (head < queue.length) {
    const p = queue[head++]
    const x = p % w
    const y = Math.floor(p / w)
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      const np = ny * w + nx
      if (visited[np]) continue
      const ni = np * ch
      if (!isBg(ni)) continue
      visited[np] = 1
      queue.push(np)
    }
  }

  for (let p = 0; p < w * h; p++) {
    const i = p * ch
    if (visited[p]) {
      out[i] = 0
      out[i + 1] = 0
      out[i + 2] = 0
      out[i + 3] = 0
    } else {
      out[i] = TARGET_R
      out[i + 1] = TARGET_G
      out[i + 2] = TARGET_B
      out[i + 3] = 255
    }
  }

  const outputPath = "public/logo-nav.png"
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(outputPath)

  const opaque = visited.reduce((n, v) => n + (v ? 0 : 1), 0)
  console.log(`Wrote ${outputPath} (${opaque} non-background pixels)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
