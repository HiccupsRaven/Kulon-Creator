import { eroot, kel } from "../../lib/kel"

type CanvasFixed = "ratioMax" | "ratioMin" | "height" | "width"

function getCanvasScale(rule: CanvasFixed, max: number, w: number, h: number): number {
  if (rule === "height") {
    return max / h
  } else if (rule === "width") {
    return max / w
  } else if (rule === "ratioMin") {
    return max / Math.min(w, h)
  }
  return max / Math.max(w, h)
}

export function toCanvasFixed(src: string, maxSize: number, rule: CanvasFixed): HTMLCanvasElement {
  const canvas = kel("canvas")

  const img = new Image()
  img.classList.add("hidden-preload")

  img.onerror = () => {
    canvas.remove()
    img.remove()
  }
  img.onload = () => {
    const imgWidth = img.width
    const imgHeight = img.height

    const scale = getCanvasScale(rule, maxSize, imgWidth, imgHeight)

    const width = Math.round(imgWidth * scale)
    const height = Math.round(imgHeight * scale)

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")!

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, width, height)
    img.remove()
  }

  img.src = src
  eroot().append(img)

  return canvas
}

export function toCanvasMax(src: string, maxSize: number): HTMLCanvasElement {
  const canvas = toCanvasFixed(src, maxSize, "ratioMax")

  return canvas
}
export function toCanvasMin(src: string, maxSize: number): HTMLCanvasElement {
  const canvas = toCanvasFixed(src, maxSize, "ratioMin")

  return canvas
}

export function toCanvasHeight(src: string, maxSize: number): HTMLCanvasElement {
  const canvas = toCanvasFixed(src, maxSize, "height")

  return canvas
}

export function toCanvasWidth(src: string, maxSize: number): HTMLCanvasElement {
  const canvas = toCanvasFixed(src, maxSize, "width")

  return canvas
}

export function toCanvasPerson(src: string, maxSize: number): HTMLCanvasElement {
  const canvas = kel("canvas")

  const img = new Image()
  img.classList.add("hidden-preload")

  img.onerror = () => {
    canvas.remove()
    img.remove()
  }
  img.onload = () => {
    const imgWidth = 64
    const imgHeight = 32

    const scale = getCanvasScale("height", maxSize, imgWidth, imgHeight)

    const width = Math.round(imgWidth * scale)
    const height = Math.round(imgHeight * scale)

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext("2d")!

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, 0, 0, width, height)
    img.remove()
  }

  img.src = src
  eroot().append(img)

  return canvas
}
