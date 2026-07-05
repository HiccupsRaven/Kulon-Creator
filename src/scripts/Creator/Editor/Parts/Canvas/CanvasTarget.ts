import { kel } from "../../../../lib/kel"
import { EditorCanvas } from "../EditorCanvas"
import { CameraCanvas } from "./CameraCanvas"

export class CanvasTarget {
  private el: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  editorCanvas: EditorCanvas
  locked: boolean = false

  private isPanning = false
  private panStartX = 0
  private panStartY = 0
  private panLastX = 0
  private panLastY = 0
  private hasMoved = false
  private isListening: boolean = false

  constructor(editorCanvas: EditorCanvas) {
    this.editorCanvas = editorCanvas
    this.el = kel("canvas", "target-canvas")
    this.ctx = this.el.getContext("2d")!
    this.init()
  }
  setSize(width: number, height: number): void {
    this.el.width = width
    this.el.height = height
  }
  private onPointerDown = (e: PointerEvent) => {
    if (e.button === 0) {
      this.isPanning = true
      this.hasMoved = false
      this.panStartX = e.clientX
      this.panStartY = e.clientY
      this.panLastX = e.clientX
      this.panLastY = e.clientY
      this.el.setPointerCapture(e.pointerId)
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.locked) return

    if (this.isPanning && this.editorCanvas.base.camera) {
      if (!this.hasMoved) {
        if (Math.abs(e.clientX - this.panStartX) > 2 || Math.abs(e.clientY - this.panStartY) > 2) {
          this.hasMoved = true
        }
        // else {
        //   // ntar dipikirin
        // }
      }

      if (this.hasMoved) {
        const dx = e.clientX - this.panLastX
        const dy = e.clientY - this.panLastY
        this.panLastX = e.clientX
        this.panLastY = e.clientY

        this.editorCanvas.base.camera.x -= dx / this.editorCanvas.base.camera.zoom
        this.editorCanvas.base.camera.y -= dy / this.editorCanvas.base.camera.zoom
        this.editorCanvas.base.camera.update()

        this.editorCanvas.base.draw()
        this.editorCanvas.grid.draw()
        this.editorCanvas.overlay.draw()
      }
    }

    const cam = this.editorCanvas.base.camera
    if (cam) {
      const camX = cam ? cam.x : 0
      const camY = cam ? cam.y : 0
      const zoom = cam ? cam.zoom : 1
      const x = Math.floor(e.offsetX / zoom + camX)
      const y = Math.floor(e.offsetY / zoom + camY)

      this.draw(x, y, cam)
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    if (e.button === 0) {
      this.isPanning = false
      this.el.releasePointerCapture(e.pointerId)

      if (!this.hasMoved) {
        const cam = this.editorCanvas.base.camera
        if (cam) {
          const x = Math.floor(e.offsetX / cam.zoom + cam.x)
          const y = Math.floor(e.offsetY / cam.zoom + cam.y)
          const gridX = Math.floor(x / 16)
          const gridY = Math.floor(y / 16)

          this.editorCanvas.middle.editor.selectTile(gridX, gridY)
        }
      }
    }
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault()
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.editorCanvas.base.camera) return
    e.preventDefault()

    let newZoom = this.editorCanvas.base.camera.zoom * Math.pow(0.999, e.deltaY)

    if (newZoom < 0.5) newZoom = 0.5
    if (newZoom > 10) newZoom = 10

    const rect = this.el.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    this.editorCanvas.base.camera.x += mouseX / this.editorCanvas.base.camera.zoom - mouseX / newZoom
    this.editorCanvas.base.camera.y += mouseY / this.editorCanvas.base.camera.zoom - mouseY / newZoom

    this.editorCanvas.base.camera.zoom = newZoom
    this.editorCanvas.base.camera.update()

    this.editorCanvas.base.draw()
    this.editorCanvas.grid.draw()
    this.editorCanvas.overlay.draw()

    this.draw()
  }

  centerize(): void {
    const cam = this.editorCanvas.base.camera
    if (cam) {
      cam.x = cam.mapWidth / 2 - this.el.width / 2 / cam.zoom
      cam.y = cam.mapHeight / 2 - this.el.height / 2 / cam.zoom
      cam.update()
      this.editorCanvas.base.draw()
      this.editorCanvas.grid.draw()
      this.editorCanvas.overlay.draw()
      this.draw()
    }
  }

  private draw(x?: number, y?: number, cam?: CameraCanvas): void {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.save()
    if (typeof x === "undefined" || typeof y === "undefined" || typeof cam === "undefined") return
    cam.apply(this.ctx)

    const gridX = Math.floor(x / 16)
    const gridY = Math.floor(y / 16)

    const tileX = gridX * 16
    const tileY = gridY * 16

    this.ctx.fillStyle = "rgba(254, 231, 91, 0.3)"
    this.ctx.fillRect(tileX, tileY, 16, 16)
    this.ctx.restore()

    this.editorCanvas.middle.editor.bottom.updateCoor(x, y, gridX, gridY)
  }

  lock(status: boolean = true): void {
    this.locked = status
  }

  init(): void {
    if (this.isListening) return
    this.isListening = true
    this.el.addEventListener("pointerdown", this.onPointerDown)
    this.el.addEventListener("pointermove", this.onPointerMove)
    this.el.addEventListener("pointerup", this.onPointerUp)
    this.el.addEventListener("contextmenu", this.onContextMenu)
    this.el.addEventListener("wheel", this.onWheel, { passive: false })
  }
  get canvas(): HTMLCanvasElement {
    return this.el
  }
  destroy(): void {
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    if (!this.isListening) return
    this.isListening = false
    this.el.removeEventListener("pointerdown", this.onPointerDown)
    this.el.removeEventListener("pointermove", this.onPointerMove)
    this.el.removeEventListener("pointerup", this.onPointerUp)
    this.el.removeEventListener("contextmenu", this.onContextMenu)
    this.el.removeEventListener("wheel", this.onWheel)
  }
}
