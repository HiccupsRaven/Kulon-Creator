import asset from "../../../../data/assets"
import { eroot, futor, kel } from "../../../../lib/kel"
import { IAny } from "../../../../types/LibTypes"
import { work } from "../../../data/work"
import { Editor } from "../../../Editor"
import { IGameObjectData, IMapConfig } from "../../../types/CreatorTypes"
import { inlineEmpty } from "../../_inlineMsg"
import { NewObject } from "../../Forms/NewObject"
import { windowed } from "../../Forms/Windowed"
import { toText } from "../../../lib/gen"
import { toCanvasHeight, toCanvasPerson } from "../../../lib/toCanvasWork"
import { getHero } from "../../../data/systemObjects"

class ChooserMap {
  private el!: HTMLDivElement

  private chooser: EditorObjects

  private isActive: boolean = false

  readonly itm: IMapConfig
  readonly id: IMapConfig["id"]
  readonly name: IMapConfig["name"]
  readonly objSize: number
  constructor(itm: IMapConfig, editorObjects: EditorObjects) {
    this.chooser = editorObjects
    this.itm = itm
    this.id = itm.id
    this.name = itm.name
    this.objSize = Object.keys(itm.configObjects).filter((k) => itm.configObjects[k].type !== "Teleporter").length
  }
  private createElement(): void {
    this.el = kel("div", "card")
    this.el.innerHTML = `
    <div class="text">
      <p class="text-name">${toText(this.name)}</p>
      <p class="text-sub">${this.objSize} object(s)</p>
    </div>`
  }
  private setPreview(): void {
    if (this.id === "all") {
      const pSub = futor(".text-sub", this.el)
      pSub.remove()
    }
  }
  activate(status: boolean = true): void {
    if (status) {
      this.el.classList.add("active")
      return
    }
    this.el.classList.remove("active")
  }
  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  private onClick(): void {
    this.el.onclick = () => {
      this.chooser.onMapChosen(this.id)
      this.isActive = true
    }
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.setPreview()
    this.onClick()
    return this
  }
}
class ChooserObject {
  private el!: HTMLDivElement

  private chooser: EditorObjects

  readonly itm: IGameObjectData
  readonly id: IGameObjectData["id"]
  readonly name: IGameObjectData["name"]
  readonly type: IGameObjectData["type"]
  readonly src: IGameObjectData["src"]
  readonly x: IGameObjectData["x"]
  readonly y: IGameObjectData["y"]

  readonly mapId: IMapConfig["id"]

  constructor(itm: IGameObjectData, mapId: IMapConfig["id"], editorObjects: EditorObjects) {
    this.chooser = editorObjects
    this.itm = itm
    this.id = itm.id
    this.name = itm.name
    this.type = itm.type
    this.src = itm.src
    this.x = itm.x
    this.y = itm.y
    this.mapId = mapId
  }
  private createElement(): void {
    this.el = kel("div", "card")
    this.el.innerHTML = `
    <div class="text">
      <p class="text-name">${toText(this.name!)}</p>
      <p class="text-sub">${this.type.toString()} ${this.x}x ${this.y}y</p>
    </div>
    <div class="ic"></div>`
  }
  private setPreview(): void {
    const ic = futor(".ic", this.el)

    const img = this.type === "Person" ? toCanvasPerson(asset[this.src! as string].src, 100) : toCanvasHeight(asset[this.src! as string].src, 100)

    ic.append(img)
  }
  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  destroy(): void {
    this.el.remove()
  }
  private onClick(): void {
    this.el.onclick = () => this.chooser.onObjectChosen(this.itm, this.mapId)
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.setPreview()
    this.onClick()
    return this
  }
}

export interface EditorObjectConfig {
  editor: Editor
  isPicker?: boolean
  mapId?: IMapConfig["id"]
}

export class EditorObjects {
  locked: boolean = false
  private el!: HTMLDivElement
  private parent!: HTMLDivElement

  list: ChooserObject[] = []
  mapList: ChooserMap[] = []

  protected currMap?: IMapConfig["id"] = "all"

  protected emptyFile?: HTMLDivElement

  protected field!: HTMLDivElement
  protected mapField!: HTMLDivElement

  private onSubmission?: (s?: IGameObjectData) => IAny

  private isNoChange: boolean = false

  private isPicker: boolean

  editor: Editor

  private latestInp?: string

  constructor(config: EditorObjectConfig) {
    this.editor = config.editor
    this.isPicker = config.isPicker || false
    this.currMap = config.mapId
  }
  createElement(): void {
    this.el = kel("div", "event-chooser map-chooser")
    this.el.innerHTML = `
    <div class="chooser-title">${this.isPicker ? "Choose Object" : "Object List"}</div>
    <div class="list">
      <div class="chooser-list list-left">
        <div class="card-search">
          <input type="text" name="object-map-search" id="object-map-search" placeholder="Search Map" />
        </div>
      </div>
      <div class="chooser-list list-right">
        <div class="card-search">
          <input type="text" name="object-search" id="object-search" placeholder="Search Object" />
        </div>
      </div>
    </div>
    <div class="chooser-actions">
      <div class="btn btn-cancel"><i class="fa-regular fa-arrow-left"></i> Back</div>
    </div>`

    this.field = futor(".chooser-list.list-right", this.el) as HTMLDivElement
    this.mapField = futor(".chooser-list.list-left", this.el) as HTMLDivElement
  }
  private writeData(): void {
    const defaultCardConfig: IMapConfig = {
      id: "all",
      name: "All Objects",
      configObjects: {},
      cutscenes: {},
      walls: {},
      lowerSrc: "null",
      upperSrc: "null"
    }

    const defaultCard = new ChooserMap(defaultCardConfig, this)
    defaultCard.init()
    this.mapField.append(defaultCard.html)
    this.mapList.push(defaultCard)

    if (this.isPicker) this.writeHero()

    const workKeys = Object.keys(work)
    workKeys.forEach((key) => {
      const obj = work[key].configObjects
      const map = work[key]
      Object.keys(obj)
        .filter((k) => obj[k].type !== "Teleporter")
        .forEach((k) => {
          const card = new ChooserObject(obj[k], map.id, this)
          card.init()
          this.field.append(card.html)
          this.list.push(card)
        })
      const mapCard = new ChooserMap(map, this)
      mapCard.init()
      this.mapField.append(mapCard.html)
      this.mapList.push(mapCard)
    })

    this.checkEmpty()
  }

  private writeHero(): void {
    const card = new ChooserObject(getHero(), "kulon", this)
    card.init()
    this.field.append(card.html)
    this.list.push(card)
  }

  protected checkEmpty(): void {
    if (this.list.length < 1) {
      if (!this.emptyFile) {
        this.emptyFile = inlineEmpty("-- Empty --")
      }
      this.field.append(this.emptyFile)
      return
    }

    if (this.emptyFile) {
      this.emptyFile.remove()
      this.emptyFile = undefined
    }
  }
  private searchListener(): void {
    const inp = futor("#object-search", this.el) as HTMLInputElement

    inp.oninput = () => {
      const val = inp.value.trim().toLowerCase()

      this.latestInp = val
      this.sortObjects(val)
    }

    const inpMap = futor("#object-map-search", this.el) as HTMLInputElement

    inpMap.oninput = () => {
      const val = inpMap.value.trim().toLowerCase()

      this.mapList.forEach((itm) => {
        const itmName = itm.name?.toLowerCase()

        itm.hide(!itmName?.includes(val))
      })
    }
  }
  private cancelListener(): void {
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = () => {
      if (this.locked) return
      this.destroy()
      if (this.onSubmission) {
        this.onSubmission()
        this.onSubmission = undefined
      }
    }
  }
  onMapChosen(mapId: IMapConfig["id"]): void {
    if (this.isNoChange) return

    if (this.locked) return
    this.locked = true

    this.currMap = mapId

    this.mapList.forEach((k) => k.activate(k.id === mapId))

    this.locked = false

    this.sortObjects(this.latestInp)
  }
  set noChange(status: boolean) {
    this.isNoChange = status
  }
  sortObjects(val?: string): void {
    this.list.forEach((itm) => {
      const itmName = itm.name?.toLowerCase()

      if (!val) return itm.hide(itm.mapId !== "kulon" && this.currMap !== "all" && itm.mapId !== this.currMap)

      itm.hide(!itmName?.includes(val) || (itm.mapId !== "kulon" && itm.mapId !== this.currMap && this.currMap !== "all"))
    })
  }
  onObjectChosen(itm: IGameObjectData, mapId: string): void {
    if (this.isPicker) return this.destroy(itm)

    return this.goToUpdateObject(itm, mapId)
  }
  goToUpdateObject(itm: IGameObjectData, mapId: string): void {
    const statMid = !this.editor.middle.locked
    const statTop = !this.editor.top.locked
    const statBtm = !this.editor.bottom.locked

    this.editor.middle.lock(false)
    this.editor.top.lock(false)
    this.editor.bottom.lock(false)

    this.editor.startMap(mapId)

    this.editor.middle.lock(!statMid)
    this.editor.top.lock(!statTop)
    this.editor.bottom.lock(!statBtm)

    this.editor.top.lock()
    const newObject = new NewObject(itm.x, itm.y, this.editor)
    newObject.onDone((s?: IGameObjectData, isDeleted?: boolean) => {
      this.editor.parseNewObject(s, isDeleted)

      const newEditorObjects = new EditorObjects({
        editor: this.editor,
        isPicker: this.isPicker,
        mapId: this.currMap
      })
      newEditorObjects.init()
    })
    this.destroy()
    newObject.init()
  }
  onDone(newFunc: (s?: IGameObjectData) => void): void {
    this.onSubmission = newFunc
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(itm?: IGameObjectData): void {
    this.list.forEach((k) => k.destroy())

    this.list.splice(0, this.list.length)
    this.parent.remove()
    if (this.onSubmission) {
      this.onSubmission(itm)
      this.onSubmission = undefined
    }
  }
  init(mapId: string = "all"): this {
    this.createElement()
    this.parent = windowed(this.el)
    eroot().append(this.parent)
    this.writeData()
    this.onMapChosen(mapId)
    this.searchListener()
    this.cancelListener()
    return this
  }
}
