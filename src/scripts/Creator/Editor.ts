import { eroot, kel } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import { IAny } from "../types/LibTypes"
import { Dashboard } from "./Dashboard"
import { resetWorkSpace, work } from "./data/work"
import { EditorBottom } from "./Editor/EditorBottom"
import { EditorMiddle } from "./Editor/EditorMiddle"
import { EditorTop } from "./Editor/EditorTop"
import { ICutsceneToReturn, NewCutscene } from "./Editor/Forms/NewCutscene"
import { NewObject } from "./Editor/Forms/NewObject"
import { NewTeleporter } from "./Editor/Forms/NewTeleporter"
import { toObject, toText } from "./lib/gen"
import { doTell } from "./lib/tell"
import { EditorMaps } from "./Editor/Parts/Sys/EditorMaps"
import { IGameObjectData, ITileAction } from "./types/CreatorTypes"

export interface IBulkCoor {
  x: number
  y: number
}

function checkTile(x: number, y: number, mapId?: string): ITileAction {
  if (!mapId) return "free"

  const map = work[mapId]
  if (!map) return "free"

  const isObj = Object.values(map.configObjects).find((obj) => obj.x === x && obj.y === y)
  if (isObj) {
    if (isObj.type === "Teleporter") return "teleporter"
    return "object"
  }

  const isCutscene = Object.keys(map.cutscenes).find((k) => {
    const [spaceX, spaceY] = k.split(",")
    return Number(spaceX) === x && Number(spaceY) === y
  })

  if (isCutscene) return "cutscene"

  const isWall = Object.keys(map.walls).find((k) => {
    const [spaceX, spaceY] = k.split(",")
    return Number(spaceX) === x && Number(spaceY) === y
  })

  if (isWall) return "wall"

  return "free"
}

export class Editor {
  top!: EditorTop
  middle!: EditorMiddle
  bottom!: EditorBottom

  private isLocked: boolean = false

  bulk: IBulkCoor[] = []
  currentAction: ITileAction = "wall"
  waitingAction: ITileAction = "free"
  curMap?: string

  backToMap: string | null = null

  private el!: HTMLDivElement

  private onFindCoor?: (x?: number, y?: number, map?: string) => IAny

  constructor() {}
  get locked(): boolean {
    return this.isLocked || this.top.locked || this.middle.locked || this.bottom.locked
  }
  createElement(): void {
    this.el = kel("div", "Editor")
  }

  writeAll(): void {
    this.top = new EditorTop({ editor: this }).init()
    this.middle = new EditorMiddle({ editor: this }).init()
    this.bottom = new EditorBottom({ editor: this }).init()

    this.el.append(this.top.html, this.middle.html, this.bottom.html)
  }

  async setTileAction(newTileAction: ITileAction): Promise<boolean> {
    if (this.currentAction === "record") {
      await modal.alert("Cannot switch selection! You are now in the tile coordinate selection mode. Please select a tile to continue.")
      return false
    }
    const tileActions: ITileAction[] = ["bulk", "cutscene", "free", "object", "teleporter", "wall"]
    if (!tileActions.find((k) => k === newTileAction)) return false
    this.currentAction = newTileAction
    return true
  }
  async selectTile(x: number, y: number): Promise<void> {
    if (!this.curMap) return

    const selectedTileType = checkTile(x, y, this.curMap)

    if (this.currentAction === "record") {
      if (selectedTileType !== "free") {
        await modal.alert(`Cannot set to ${x}x ${y}y because the tile already had <b>${selectedTileType}</b> assigned`)
        return
      }
      if (this.onFindCoor) this.onFindCoor(x, y, this.currentMap)
      this.currentAction = this.waitingAction
      this.waitingAction = "free"
      return
    }

    if (this.locked) return

    this.top.lock()
    if (selectedTileType !== "free" && selectedTileType !== this.currentAction) {
      await modal.alert(`Cannot set <b>${this.currentAction}</b> to <b>tile ${x}x ${y}y</b> because the tile already had <b>${selectedTileType}</b> assigned`)

      this.top.lock(false)
      return
    }
    this.top.lock(false)

    if (this.currentAction === "bulk") {
      const curBulk = this.bulk.findIndex((k) => k.x === x && k.y === y)
      if (curBulk === -1) {
        this.bulk.push({ x, y })
      } else {
        this.bulk.splice(curBulk, 1)
      }
      this.middle.canvas.overlay.draw()
    }

    if (this.currentAction === "wall") {
      const coor = `${x},${y}`
      const walls = work[this.curMap].walls
      if (!walls) work[this.curMap].walls = {}
      if (work[this.curMap].walls[coor]) {
        work[this.curMap].walls[coor] = false
        delete work[this.curMap].walls[coor]
      } else {
        work[this.curMap].walls[coor] = true
      }
      this.middle.canvas.overlay.draw()
    }

    if (this.currentAction === "teleporter") {
      this.top.lock()
      const newTeleporter = new NewTeleporter(x, y, this)
      newTeleporter.onDone((s?: IGameObjectData, isDeleted?: boolean) => {
        this.parseNewObject(s, isDeleted)
      })
      newTeleporter.init()
    }

    if (this.currentAction === "object") {
      this.top.lock()
      const newObject = new NewObject(x, y, this)
      newObject.onDone((s?: IGameObjectData, isDeleted?: boolean) => {
        this.parseNewObject(s, isDeleted)
      })
      newObject.init()
    }

    if (this.currentAction === "cutscene") {
      this.top.lock()
      const key = `${x},${y}`
      const newCutscene = new NewCutscene({
        x,
        y,
        editor: this,
        type: "cutscene",
        events: toObject(work[this.curMap!].cutscenes[key] || [])
      })

      newCutscene.onDone((s?: ICutsceneToReturn, isCanceled?: boolean, isDeleted?: boolean) => {
        this.parseNewCutscene(s, isCanceled, isDeleted)
      })

      newCutscene.init()
    }
  }

  async bulkNewCutscene(): Promise<void> {
    if (this.locked) return
    this.top.lock()
    const newCutscene = new NewCutscene({
      editor: this,
      type: "bulk",
      events: []
    })

    newCutscene.onDone((s?: ICutsceneToReturn, isCanceled?: boolean) => {
      this.parseBulkCutscene(s, isCanceled)
    })

    newCutscene.init()
  }

  findTile(newFunc: (x?: number, y?: number, map?: string) => void): void {
    this.onFindCoor = newFunc
    this.setCurrentAction("record")
  }

  setCurrentAction(newAct: ITileAction): void {
    this.waitingAction = this.currentAction
    this.currentAction = newAct
  }

  cancelFindTile(): void {
    this.currentAction = this.waitingAction
    this.mapToBack(null)
    if (this.onFindCoor) {
      this.onFindCoor()
      this.onFindCoor = undefined
    }
  }

  mapToBack(mapId: string | null): void {
    this.backToMap = mapId
  }

  parseNewObject(data?: IGameObjectData, isDeleted?: boolean): void {
    this.top.lock(false)
    if (isDeleted && data) {
      delete work[this.curMap!].configObjects[data.id!]
      doTell(`Object <b>${toText(data?.name || "no name")}</b> Deleted`)
    } else if (data) {
      work[this.curMap!].configObjects[data.id!] = data
    }

    if (!data) return

    this.middle.canvas.overlay.draw()
  }

  parseNewCutscene(data?: ICutsceneToReturn, isCanceled?: boolean, isDeleted?: boolean): void {
    this.top.lock(false)
    if (isCanceled) return

    if (isDeleted && data && data.oldKey) {
      delete work[this.curMap!].cutscenes[data.oldKey]
      doTell(`Cutscene Space <b>${data.oldKey}</b> Deleted`)
      this.middle.canvas.overlay.draw()
      return
    }

    if (!data || !data.oldKey || !data.key || !data.cutscene) return

    delete work[this.curMap!].cutscenes[data.oldKey]
    work[this.curMap!].cutscenes[data.key] = data.cutscene
    this.middle.canvas.overlay.draw()
  }

  private parseBulkCutscene(data?: ICutsceneToReturn, isCanceled?: boolean): void {
    this.top.lock(false)
    if (isCanceled) return

    if (!data || !data.cutscene) return

    this.bulk.forEach((k) => (work[this.curMap!].cutscenes[`${k.x},${k.y}`] = data.cutscene!))

    this.resetBulk()

    this.middle.canvas.overlay.draw()
  }

  parseNewMap(mapId: string, isDeleted: boolean = false): void {
    if (this.middle.sys.field instanceof EditorMaps) {
      this.middle.sys.field.updateMap(mapId, isDeleted)
    }
    this.startMap(isDeleted ? Object.keys(work)[0] : mapId, true)
  }

  parseDeletedMap(mapId: string, mapName: string): void {
    delete work[mapId]
    doTell(`Deleted: Map <b>${toText(mapName)}</b>`)

    this.onMapDeleted()

    if (this.middle.sys.field instanceof EditorMaps) {
      this.middle.sys.field.updateMap(mapId, true)
    }
  }

  private onMapDeleted(): void {
    const firstMapKey = Object.keys(work)[0]
    if (firstMapKey) return this.startMap(firstMapKey)

    this.curMap = undefined
    this.middle.canvas.clearAll()
    this.middle.conf.configMap.checkCurrentMap()
    this.middle.conf.linkMap(undefined)
  }

  checkFromBulk(): boolean {
    if (this.bulk.length >= 1) return true
    return false
  }

  resetBulk(): void {
    this.bulk.splice(0, this.bulk.length)
  }

  startMap(mapId: string, isForced: boolean = false): void {
    if (this.locked && !this.backToMap) return

    if (this.curMap === mapId && !isForced) return

    this.resetBulk()

    this.curMap = mapId

    this.middle.conf.linkMap(mapId)
    this.middle.conf.configMap.checkWeather()
    this.middle.canvas.start(mapId)

    if (this.middle.sys.field instanceof EditorMaps) {
      this.middle.sys.field.activateMap(mapId)
    }

    this.middle.canvas.onResize()
    this.middle.conf.configMap.checkCurrentMap()
  }

  get currentMap(): string | undefined {
    return this.curMap
  }

  async destroy(dashboard?: Dashboard): Promise<void> {
    if (this.locked) return
    this.isLocked = true
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    this.isLocked = false
    resetWorkSpace()
    if (dashboard) dashboard.init()
  }

  init(): this {
    this.createElement()
    this.writeAll()
    eroot().append(this.el)
    this.middle.conf.configMap.checkCurrentMap()
    const firstMapKey = Object.keys(work)[0]
    if (firstMapKey) this.startMap(firstMapKey)
    return this
  }
}
