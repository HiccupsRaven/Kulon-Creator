import { kel } from "../../../../lib/kel"
import { work } from "../../../data/work"
import { inlineEmpty } from "../../_inlineMsg"
import { NewMap } from "../../Forms/NewMap"
import { EditorSys } from "../EditorSys"

export interface EditorMapsConfig {
  sys: EditorSys
}

function createBtnNewMap(): HTMLDivElement {
  const el = kel("div", "btn btn-new-map")
  el.innerHTML = '<i class="fa-solid fa-plus"></i> New Map'
  return el
}

class MapCard {
  private el!: HTMLDivElement
  private nameEl?: HTMLDivElement

  private isAcitaved: boolean = false

  name: string = "noname"
  maps: EditorMaps
  id: string

  constructor(maps: EditorMaps, id: string) {
    this.maps = maps
    this.id = id
  }
  private createElement(): void {
    this.el = kel("div", "btn card")
    this.updateName()
    const cardShow = kel("div", "card-show")
    cardShow.innerHTML = `<i class="fa-solid fa-arrow-right"></i>`
    this.el.append(cardShow)
  }
  updateName(): void {
    if (!this.nameEl) {
      this.nameEl = kel("div", "card-name")
      this.el.append(this.nameEl)
    }
    this.nameEl.innerText = work[this.id].name
  }
  onClick(): void {
    this.el.onclick = () => this.maps.onMapClicked(this.id)
  }
  get isActive(): boolean {
    return !!this.isAcitaved
  }
  activate(status: boolean = true): void {
    if (status) {
      this.isAcitaved = true
      return this.el.classList.add("active")
    }
    this.isAcitaved = false
    this.el.classList.remove("active")
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    this.el.remove()
  }
  init(): this {
    this.createElement()
    this.onClick()
    return this
  }
}

export class EditorMaps {
  locked: boolean = false
  private el!: HTMLDivElement
  sys!: EditorSys

  private btnNewMap: HTMLDivElement = createBtnNewMap()
  private emptyMap?: HTMLDivElement

  private list: MapCard[] = []

  constructor(s: EditorMapsConfig) {
    this.sys = s.sys
  }
  private createElement(): void {
    this.el = kel("div", "content-maps")
    this.emptyMap = inlineEmpty("Create new map to start")
    this.el.append(this.btnNewMap, this.emptyMap)
  }
  private newMapWork(): void {
    this.btnNewMap.onclick = () => {
      if (this.sys.middle.editor.locked) return
      this.sys.middle.lock()
      const mapForm = new NewMap({ sys: this.sys })
      mapForm.init()
    }
  }
  private writeData(): void {
    Object.keys(work).forEach((k) => this.updateMap(k))
  }
  private checkEmpty(): void {
    if (Object.keys(work).length < 1) {
      if (!this.emptyMap) {
        this.emptyMap = inlineEmpty("Create new map to start")
      }
      this.el.append(this.emptyMap)
      return
    }

    if (this.emptyMap) {
      this.emptyMap.remove()
      this.emptyMap = undefined
    }
  }
  updateMap(mapId: string, deleted: boolean = false): void {
    if (deleted) {
      const mapIndex = this.list.findIndex((k) => k.id === mapId)
      if (mapIndex === -1) return
      this.list[mapIndex].destroy()
      this.list.splice(mapIndex, 1)
      this.checkEmpty()
      return
    }

    const existsCard = this.list.find((k) => k.id === mapId)
    if (existsCard) {
      existsCard.updateName()
      return
    }

    const mapCard = new MapCard(this, mapId).init()

    this.list.push(mapCard)

    this.el.append(mapCard.html)

    this.activateMap(this.sys.middle.editor.curMap)

    this.checkEmpty()
  }

  onMapClicked(mapId: string): void {
    this.sys.middle.editor.startMap(mapId)
  }

  activateMap(mapId?: string): void {
    if (!mapId) return
    const currentActive = this.list.find((map) => map.isActive)
    if (currentActive) currentActive.activate(false)

    const map = this.list.find((map) => map.id === mapId)
    map?.activate()
  }

  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    if (this.sys.middle.locked) return
    this.sys.middle.lock(true)
    this.el.classList.add("out")
    this.el.remove()
    this.sys.middle.lock(false)
  }
  init(): this {
    this.createElement()
    this.writeData()
    this.newMapWork()
    return this
  }
}
