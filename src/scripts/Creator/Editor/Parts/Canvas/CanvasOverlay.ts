import { IMapConfig } from "../../../types/CreatorTypes"
import { kel } from "../../../../lib/kel"
import { work } from "../../../data/work"
import { EditorCanvas } from "../EditorCanvas"
import { toObject } from "../../../lib/gen"

export class CanvasOverlay {
  private el: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  editorCanvas: EditorCanvas

  private mapWork!: IMapConfig

  constructor(editorCanvas: EditorCanvas) {
    this.editorCanvas = editorCanvas
    this.el = kel("canvas", "overlay-canvas")
    this.ctx = this.el.getContext("2d")!
  }
  resize(width: number, height: number): void {
    this.el.width = width
    this.el.height = height
    this.draw()
  }
  draw(): void {
    const cam = this.editorCanvas.base.camera
    if (!cam) return

    if (!this.editorCanvas.mapId) return
    const mapId = this.editorCanvas.mapId

    const map = work[mapId]
    if (!map) return
    this.mapWork = toObject(map)

    this.ctx.clearRect(0, 0, this.el.width, this.el.height)
    this.ctx.save()

    cam.apply(this.ctx)

    this.drawObjects()
    this.drawCutsceneSpaces()
    this.drawWalls()
    this.drawBulk()

    this.ctx.restore()
  }

  drawObjects(): void {
    const cobj = this.mapWork.configObjects || {}

    Object.keys(cobj).forEach((k) => {
      const obj = cobj[k]
      const tileX = obj.x * 16
      const tileY = obj.y * 16

      if (cobj[k].type === "Teleporter") {
        this.ctx.fillStyle = "rgba(11, 17, 29, 0.5)"
      } else {
        this.ctx.fillStyle = "rgba(88, 101, 241, 0.5)"
      }

      this.ctx.fillRect(tileX, tileY, 16, 16)
    })
  }

  drawCutsceneSpaces(): void {
    const cevt = this.mapWork.cutscenes || {}
    Object.keys(cevt).forEach((k) => {
      const [x, y] = k.split(",")
      const tileX = Number(x) * 16
      const tileY = Number(y) * 16

      this.ctx.fillStyle = "rgba(108, 204, 113, 0.5)"
      this.ctx.fillRect(tileX, tileY, 16, 16)
    })
  }
  drawWalls(): void {
    const cwall = this.mapWork.walls || {}
    Object.keys(cwall).forEach((k) => {
      const [x, y] = k.split(",")
      const tileX = Number(x) * 16
      const tileY = Number(y) * 16

      this.ctx.fillStyle = "rgba(255, 110, 110, 0.5)"
      this.ctx.fillRect(tileX, tileY, 16, 16)
    })
  }

  drawBulk(): void {
    const cbulk = this.editorCanvas.middle.editor.bulk || {}
    cbulk.forEach((k) => {
      const { x, y } = k
      const tileX = x * 16
      const tileY = y * 16

      this.ctx.fillStyle = "rgba(240, 242, 243, 0.5)"
      this.ctx.fillRect(tileX, tileY, 16, 16)
    })
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
