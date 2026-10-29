import sharp from "sharp"
import path from "path"

const ROOT = path.join(import.meta.dirname, "..")
const SRC = path.join(
  process.env.HOME,
  ".cursor/projects/Users-kofiadu-ansah-rmb-trade-rmb-trade/assets/trade-rmb-logo-cedi.jpg",
)
const OG_SRC = path.join(
  process.env.HOME,
  ".cursor/projects/Users-kofiadu-ansah-rmb-trade-rmb-trade/assets/trade-rmb-og.jpg",
)
const PUBLIC = path.join(ROOT, "public")
const APP = path.join(ROOT, "app")

function isBackgroundPixel(r, g, b) {
  const min = Math.min(r, g, b)
  const max = Math.max(r, g, b)
  return min > 210 && max - min < 28
}

async function knockOutWhite(inputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const out = Buffer.from(data)
  const visited = new Uint8Array(width * height)
  const queue = []

  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const p = y * width + x
    if (visited[p]) return
    const o = p * 4
    if (!isBackgroundPixel(out[o], out[o + 1], out[o + 2])) return
    visited[p] = 1
    queue.push(p)
  }

  for (let x = 0; x < width; x++) {
    seed(x, 0)
    seed(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    seed(0, y)
    seed(width - 1, y)
  }

  let head = 0
  while (head < queue.length) {
    const p = queue[head++]
    const x = p % width
    const y = Math.floor(p / width)
    seed(x + 1, y)
    seed(x - 1, y)
    seed(x, y + 1)
    seed(x, y - 1)
  }

  for (let p = 0; p < width * height; p++) {
    const o = p * 4
    if (visited[p]) {
      out[o + 3] = 0
    }
  }

  // Remove leftover JPEG specks (tiny opaque islands)
  const copy = Buffer.from(out)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x
      const o = p * 4
      if (copy[o + 3] === 0) continue
      let opaqueNeighbors = 0
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, -1],
        [1, -1],
        [-1, 1],
      ]) {
        const no = ((y + dy) * width + (x + dx)) * 4
        if (copy[no + 3] > 20) opaqueNeighbors += 1
      }
      if (opaqueNeighbors <= 2 && isBackgroundPixel(copy[o], copy[o + 1], copy[o + 2])) {
        out[o + 3] = 0
      }
    }
  }

  return sharp(out, { raw: { width, height, channels: 4 } }).trim({ threshold: 12 })
}

async function paddedSquare(pipeline, size, padRatio = 0.12) {
  const buf = await pipeline.png().toBuffer()
  const inner = Math.round(size * (1 - padRatio * 2))
  const resized = await sharp(buf)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .png()
}

async function onBackground(transparentPng, size, bg) {
  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: transparentPng, gravity: "centre" }])
    .png()
}

async function main() {
  const cutout = await knockOutWhite(SRC)
  const logo1024 = await paddedSquare(cutout, 1024, 0.08)
  const logoNav = await paddedSquare(await knockOutWhite(SRC), 512, 0.08)

  await logo1024.toFile(path.join(PUBLIC, "logo.png"))
  await logoNav.toFile(path.join(PUBLIC, "logo-nav.png"))

  const mark192 = await paddedSquare(await knockOutWhite(SRC), 192, 0.1)
  const mark192Buf = await mark192.toBuffer()
  const mark512 = await paddedSquare(await knockOutWhite(SRC), 512, 0.1)
  const mark512Buf = await mark512.toBuffer()
  const mark180 = await paddedSquare(await knockOutWhite(SRC), 180, 0.1)
  const mark180Buf = await mark180.toBuffer()
  const mark32 = await paddedSquare(await knockOutWhite(SRC), 32, 0.08)
  const mark32Buf = await mark32.toBuffer()

  const white = { r: 255, g: 255, b: 255, alpha: 255 }

  await onBackground(mark192Buf, 192, white).then((s) => s.toFile(path.join(PUBLIC, "icon-192.png")))
  await onBackground(mark512Buf, 512, white).then((s) => s.toFile(path.join(PUBLIC, "icon-512.png")))
  await onBackground(mark180Buf, 180, white).then((s) => s.toFile(path.join(PUBLIC, "apple-touch-icon.png")))
  await onBackground(mark32Buf, 32, white).then((s) => s.toFile(path.join(PUBLIC, "favicon-32.png")))
  await onBackground(mark32Buf, 32, white).then((s) => s.toFile(path.join(APP, "icon.png")))
  await onBackground(mark180Buf, 180, white).then((s) => s.toFile(path.join(APP, "apple-icon.png")))

  await sharp(OG_SRC)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .png({ quality: 90 })
    .toFile(path.join(PUBLIC, "og.png"))

  console.log("Brand assets written")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
