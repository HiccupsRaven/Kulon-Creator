import asset from "../../../data/assets"
import { kel } from "../../../lib/kel"
import { work } from "../../data/work"
import { EditorMiddle } from "../EditorMiddle"
import { CanvasBase } from "./Canvas/CanvasBase"
import { CanvasGrid } from "./Canvas/CanvasGrid"
import { CanvasOverlay } from "./Canvas/CanvasOverlay"
import { CanvasTarget } from "./Canvas/CanvasTarget"

interface EditorCanvasConfig {
  middle: EditorMiddle
}

export class EditorCanvas {
  locked: boolean = false
  private el!: HTMLDivElement
  middle!: EditorMiddle

  mapId?: string

  base: CanvasBase = new CanvasBase(this)
  grid: CanvasGrid = new CanvasGrid(this)
  target: CanvasTarget = new CanvasTarget(this)
  overlay: CanvasOverlay = new CanvasOverlay(this)

  VIEW_EL_WIDTH: number = 360
  VIEW_EL_HEIGHT: number = 360

  private elementResized!: (ev: UIEvent) => void

  constructor(s: EditorCanvasConfig) {
    this.middle = s.middle
  }
  private createElement(): void {
    this.el = kel("div", "mid")
    this.el.append(this.base.canvas, this.overlay.canvas, this.grid.canvas, this.target.canvas)
  }

  start(mapId?: string): void {
    if (!mapId) return

    this.mapId = mapId

    const map = work[mapId]
    if (!map) {
      this.base.destroy()
      return
    }

    const lowerSrc = asset[map.lowerSrc]?.src
    const upperSrc = asset[map.upperSrc]?.src

    if (!lowerSrc || !upperSrc) {
      this.base.destroy()
      return
    }

    this.target.init()
    this.base.setImage(lowerSrc, upperSrc)
  }
  clearAll(): void {
    this.mapId = undefined
    this.base.destroy()
    this.grid.destroy()
    this.overlay.destroy()
    this.target.destroy()
  }
  onResize(): void {
    this.VIEW_EL_WIDTH = this.el.clientWidth
    this.VIEW_EL_HEIGHT = this.el.clientHeight

    this.base.resize(this.VIEW_EL_WIDTH, this.VIEW_EL_HEIGHT)
    this.overlay.resize(this.VIEW_EL_WIDTH, this.VIEW_EL_HEIGHT)
    this.grid.setGrid(this.VIEW_EL_WIDTH, this.VIEW_EL_HEIGHT)
    this.target.setSize(this.VIEW_EL_WIDTH, this.VIEW_EL_HEIGHT)
  }

  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    window.removeEventListener("resize", this.elementResized)
  }
  init(): this {
    this.createElement()

    this.elementResized = () => this.onResize()

    window.addEventListener("resize", this.elementResized)

    return this
  }
}
