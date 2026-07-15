let camZoom: number = 1.2

export class CameraCanvas {
  x: number
  y: number
  mapWidth: number
  mapHeight: number
  constructor(
    private canvas: HTMLCanvasElement,
    mapWidth: number,
    mapHeight: number
  ) {
    this.x = 0
    this.y = 0
    this.mapWidth = mapWidth
    this.mapHeight = mapHeight
  }

  set zoom(newZoom: number) {
    camZoom = newZoom
  }
  get zoom(): number {
    return camZoom
  }

  update(): void {
    const minX = -((this.canvas.width * 2) / 3) / camZoom
    const maxX = this.mapWidth - this.canvas.width / 3 / camZoom

    const minY = -((this.canvas.height * 2) / 3) / camZoom
    const maxY = this.mapHeight - this.canvas.height / 3 / camZoom

    if (this.x < minX) this.x = minX
    if (this.x > maxX) this.x = maxX
    if (this.y < minY) this.y = minY
    if (this.y > maxY) this.y = maxY
  }

  apply(ctx: CanvasRenderingContext2D): void {
    ctx.scale(camZoom, camZoom)
    ctx.translate(Math.round(-this.x), Math.round(-this.y))
  }
}
