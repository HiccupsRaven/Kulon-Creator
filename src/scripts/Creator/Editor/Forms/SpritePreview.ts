import asset from "../../../data/assets"
import { eroot, kel } from "../../../lib/kel"
import { GameObjectSrc, GameObjectType } from "../../types/CreatorTypes"

export interface ISpritePreviewConfig {
  src: GameObjectSrc
  type: GameObjectType
  offset?: number[]
  collision?: number[]
}

type SpriteImages = {
  [key: string]: HTMLImageElement
}
export class SpritePreview {
  private el!: HTMLCanvasElement
  private ctx!: CanvasRenderingContext2D

  private type: GameObjectType
  private offset: number[]
  private collision: number[]
  private src: GameObjectSrc

  private images: SpriteImages = {}

  private isLoaded: boolean = false

  lastTime: number = 0
  animationFrameId: number | null = null
  private currentFrame: number = 0
  private frameTimer: number = 0

  constructor(s: ISpritePreviewConfig) {
    this.type = s.type
    this.src = s.src
    this.offset = s.offset || [1, 0]
    this.collision = s.collision || [0, 0, 1, 1]
  }

  assetLoader(): void {
    if (!this.src) {
      this.el.width = 0
      this.el.height = 0
      return
    }

    const sources = typeof this.src === "string" ? [this.src] : this.src

    const imagePromises = sources.map((src, i) => {
      return new Promise((res) => {
        const image = new Image()
        image.classList.add("hidden-preload")
        image.src = asset[src].src
        this.images[i] = image
        image.onload = res
        image.onerror = res
        eroot().append(image)
      })
    })

    Promise.all(imagePromises).then(() => {
      this.isLoaded = true
    })
  }

  private createElement(): void {
    this.el = kel("canvas", "sprite-preview")
    this.el.width = 270
    this.el.height = 270

    this.ctx = this.el.getContext("2d")!
  }

  private gameLoop(currentTime: number = 0): void {
    if (!this.lastTime) {
      this.lastTime = currentTime
    }

    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    this.update(deltaTime)

    this.draw()

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this))
  }

  private update(deltaTime: number): void {
    if (!this.isLoaded || !this.images[0]) return

    const numFrames = this.type === "Person" ? 24 : Math.max(1, this.offset[0] || 1)

    if (this.currentFrame >= numFrames) {
      this.currentFrame = 0
    }

    if (numFrames > 1) {
      this.frameTimer += deltaTime
      if (this.frameTimer >= 0.2) {
        this.frameTimer = 0
        this.currentFrame = (this.currentFrame + 1) % numFrames
      }
    } else {
      this.currentFrame = 0
    }
  }

  draw(): void {
    if (!this.isLoaded || !this.images[0]) return
    const img = this.images[0]

    const numFrames = Math.max(1, this.offset[0] || 1)
    let frameWidth = img.width / numFrames

    let frameHeight = img.height
    let sourceY = 0

    if (this.type === "Person") {
      frameWidth = 16
      frameHeight = 32
      sourceY = 32
    } else if (this.offset[1] === 1) {
      frameHeight = img.height / 2
      sourceY = 0
    }

    const previewZoom = 2

    if (this.el.width !== frameWidth * previewZoom || this.el.height !== frameHeight * previewZoom) {
      this.el.width = frameWidth * previewZoom
      this.el.height = frameHeight * previewZoom
      this.ctx.imageSmoothingEnabled = false
    }

    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.save()

    const sourceX = this.currentFrame * frameWidth

    this.ctx.drawImage(img, sourceX, sourceY, frameWidth, frameHeight, 0, 0, frameWidth * previewZoom, frameHeight * previewZoom)

    if (this.type !== "Person" && this.collision && this.collision.length === 4) {
      const cx = this.collision[0] * 16 * previewZoom
      const cy = this.collision[1] * 16 * previewZoom
      const cw = this.collision[2] * 16 * previewZoom
      const ch = this.collision[3] * 16 * previewZoom

      this.ctx.fillStyle = "rgba(88, 101, 241, 0.5)"
      this.ctx.fillRect(cx, cy, cw, ch)
    }

    this.ctx.restore()
  }

  updateData(config: Partial<ISpritePreviewConfig>): void {
    if (config.offset) this.offset = config.offset || [1, 0]
    if (config.collision) this.collision = config.collision || [0, 0, 1, 1]
    if (config.type) this.type = config.type
    if (config.src) this.src = config.src

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    this.lastTime = 0

    if (config.src) {
      this.isLoaded = false
      this.images = {}
      this.assetLoader()
    }

    this.start()
  }

  get canvas(): HTMLCanvasElement {
    return this.el
  }

  start(): void {
    this.gameLoop()
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  init(): this {
    this.createElement()
    this.assetLoader()
    this.start()
    return this
  }
}
