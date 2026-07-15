import { eroot, kel } from "../../../../lib/kel"
import { EditorCanvas } from "../EditorCanvas"
import { CameraCanvas } from "./CameraCanvas"

export class CanvasBase {
  private el: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  camera?: CameraCanvas

  private lowerImage!: HTMLImageElement
  private upperImage!: HTMLImageElement

  private drawTop: boolean = false

  editorCanvas: EditorCanvas

  constructor(editorCanvas: EditorCanvas) {
    this.editorCanvas = editorCanvas
    this.el = kel("canvas", "map-canvas")
    this.ctx = this.el.getContext("2d")!
  }
  setImage(lowerSrc: string, upperSrc: string, drawTop: boolean = false): void {
    this.drawTop = drawTop
    this.init(lowerSrc, upperSrc)
  }
  private async init(lowerSrc: string, upperSrc: string): Promise<void> {
    this.lowerImage = new Image()
    this.lowerImage.classList.add("hidden-preload")

    this.upperImage = new Image()
    this.upperImage.classList.add("hidden-preload")

    await new Promise((resolve) => {
      const bottomPromise = new Promise((res) => {
        this.lowerImage.onload = res
        this.lowerImage.onerror = res
        this.lowerImage.src = lowerSrc
        eroot().append(this.lowerImage)
      })
      const topPromise = new Promise((res) => {
        this.upperImage.onload = res
        this.upperImage.onerror = res
        this.upperImage.src = upperSrc
        eroot().append(this.upperImage)
      })
      Promise.all([bottomPromise, topPromise]).then(resolve)
    })

    this.camera = new CameraCanvas(this.el, this.lowerImage.width, this.lowerImage.height)

    this.resize(this.editorCanvas.VIEW_EL_WIDTH, this.editorCanvas.VIEW_EL_HEIGHT)
    this.editorCanvas.grid.draw()
    this.editorCanvas.overlay.draw()
    this.editorCanvas.target.centerize()

    eroot().removeChild(this.lowerImage)
    eroot().removeChild(this.upperImage)
  }
  resize(width: number, height: number): void {
    this.el.width = width
    this.el.height = height
    if (this.camera) this.camera.update()
    this.draw()
    this.ctx.imageSmoothingEnabled = false
  }

  draw(): void {
    if (!this.lowerImage) return

    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.save()

    if (this.camera) this.camera.apply(this.ctx)

    this.drawLower(this.ctx)
    if (this.drawTop) this.drawUpper(this.ctx)

    this.ctx.restore()
  }
  private drawLower(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.lowerImage, 0, 0)
  }
  private drawUpper(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.upperImage, 0, 0)
  }
  renderTop(): void {
    this.drawTop = true
    this.draw()
  }
  get canvas(): HTMLCanvasElement {
    return this.el
  }
  get context(): CanvasRenderingContext2D {
    return this.ctx
  }
  destroy(): void {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.camera = undefined
  }
}
