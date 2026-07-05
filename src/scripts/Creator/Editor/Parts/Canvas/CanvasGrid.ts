import { kel } from "../../../../lib/kel"
import { EditorCanvas } from "../EditorCanvas"

export class CanvasGrid {
  private el: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  editorCanvas: EditorCanvas

  private canvasWidth!: number
  private canvasHeight!: number

  constructor(editorCanvas: EditorCanvas) {
    this.editorCanvas = editorCanvas
    this.el = kel("canvas", "grid-canvas")
    this.ctx = this.el.getContext("2d")!
  }
  setGrid(width: number, height: number): void {
    this.canvasWidth = width
    this.canvasHeight = height

    this.el.width = width
    this.el.height = height

    this.draw()
  }

  draw(): void {
    if (!this.editorCanvas.mapId) return

    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.save()

    const camera = this.editorCanvas.base.camera

    let startX = 0
    let startY = 0
    let endX = this.canvasWidth
    let endY = this.canvasHeight

    if (camera) {
      camera.apply(this.ctx)
      const visibleStartX = camera.x
      const visibleStartY = camera.y
      const visibleEndX = camera.x + this.canvasWidth / camera.zoom
      const visibleEndY = camera.y + this.canvasHeight / camera.zoom

      startX = Math.floor(visibleStartX / 16) * 16
      startY = Math.floor(visibleStartY / 16) * 16
      endX = visibleEndX + 16
      endY = visibleEndY + 16

      startX = Math.max(0, startX)
      startY = Math.max(0, startY)
      endX = Math.min(endX, camera.mapWidth)
      endY = Math.min(endY, camera.mapHeight)
    }

    this.ctx.beginPath()
    this.ctx.strokeStyle = "rgba(0,0,0,0.2)"
    this.ctx.lineWidth = camera ? 2 / camera.zoom : 2

    for (let x = startX; x <= endX; x += 16) {
      this.ctx.moveTo(x, startY)
      this.ctx.lineTo(x, endY)
    }

    for (let y = startY; y <= endY; y += 16) {
      this.ctx.moveTo(startX, y)
      this.ctx.lineTo(endX, y)
    }

    this.ctx.stroke()
    this.ctx.restore()
  }
  get canvas(): HTMLCanvasElement {
    return this.el
  }
  get context(): CanvasRenderingContext2D {
    return this.ctx
  }
  destroy(): void {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
  }
}
