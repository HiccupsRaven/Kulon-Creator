import { eroot, futor, kel } from "../../../../lib/kel"
import { IAny } from "../../../../types/LibTypes"
import { work } from "../../../data/work"
import { Editor } from "../../../Editor"
import { IMapConfig, IObjectTalk } from "../../../types/CreatorTypes"
import { inlineEmpty } from "../../_inlineMsg"
import { windowed } from "../../Forms/Windowed"
import { toText } from "../../../lib/gen"
import { ICutsceneToReturn, NewCutscene } from "../../Forms/NewCutscene"

class ChooserMap {
  private el!: HTMLDivElement

  private chooser: EditorCutscenes

  private isActive: boolean = false

  readonly itm: IMapConfig
  readonly id: IMapConfig["id"]
  readonly name: IMapConfig["name"]
  readonly objSize: number
  constructor(itm: IMapConfig, editorCutscenes: EditorCutscenes) {
    this.chooser = editorCutscenes
    this.itm = itm
    this.id = itm.id
    this.name = itm.name
    this.objSize = Object.keys(itm.cutscenes).length
  }
  private createElement(): void {
    this.el = kel("div", "card")
    this.el.innerHTML = `
    <div class="text">
      <p class="text-name">${toText(this.name)}</p>
      <p class="text-sub">${this.objSize} cutscene space(s)</p>
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
class ChooserCutscene {
  private el!: HTMLDivElement

  private chooser: EditorCutscenes

  readonly itm: IObjectTalk[]
  readonly name: string
  readonly x: number
  readonly y: number
  readonly eventSizeText: string

  readonly mapId: IMapConfig["id"]

  constructor(id: string, itm: IObjectTalk[], mapId: IMapConfig["id"], editorCutscenes: EditorCutscenes) {
    this.chooser = editorCutscenes
    this.itm = itm
    this.x = Number(id.split(",")[0])
    this.y = Number(id.split(",")[1])
    this.name = `${this.x}x ${this.y}y - [${this.x},${this.y}]`
    this.mapId = mapId

    const groupSize = itm.length
    const eventSize = itm.map((k) => k.events.length).reduce((a, b) => a + b, 0)

    this.eventSizeText = `${eventSize} event(s) of ${groupSize} group(s)`
  }
  private createElement(): void {
    this.el = kel("div", "card card-cutscene")
    this.el.innerHTML = `
    <div class="text">
      <p class="text-name"><span><b>${this.name}</b></span> <span>${this.eventSizeText}</span></p>
    </div>
    <div class="ic"></div>`
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
    this.el.onclick = () => this.chooser.onCutsceneChosen(this.x, this.y, this.itm, this.mapId)
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.onClick()
    return this
  }
}

export interface EditorCutsceneConfig {
  editor: Editor
  isPicker?: boolean
  mapId?: IMapConfig["id"]
}

export class EditorCutscenes {
  locked: boolean = false
  private el!: HTMLDivElement
  private parent!: HTMLDivElement

  list: ChooserCutscene[] = []
  mapList: ChooserMap[] = []

  protected currMap?: IMapConfig["id"] = "all"

  protected emptyFile?: HTMLDivElement

  protected field!: HTMLDivElement
  protected mapField!: HTMLDivElement

  private onSubmission?: (x?: number, y?: number, s?: IObjectTalk[]) => IAny

  private isNoChange: boolean = false

  private isPicker: boolean

  editor: Editor

  private latestInp?: string

  constructor(config: EditorCutsceneConfig) {
    this.editor = config.editor
    this.isPicker = config.isPicker || false
    this.currMap = config.mapId
  }
  createElement(): void {
    this.el = kel("div", "event-chooser map-chooser")
    this.el.innerHTML = `
    <div class="chooser-title">${this.isPicker ? "Choose Cutscene Space" : "Cutscene Space List"}</div>
    <div class="list">
      <div class="chooser-list list-left">
        <div class="card-search">
          <input type="text" name="cutscene-map-search" id="cutscene-map-search" placeholder="Search Map" />
        </div>
      </div>
      <div class="chooser-list list-right">
        <div class="card-search">
          <input type="text" name="cutscene-search" id="cutscene-search" placeholder="Search Cutscene Space" />
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
      name: "All Cutscenes",
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

    const workKeys = Object.keys(work)
    workKeys.forEach((key) => {
      const cts = work[key].cutscenes
      const map = work[key]
      Object.keys(cts).forEach((k) => {
        const card = new ChooserCutscene(k, cts[k], map.id, this)
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
    const inp = futor("#cutscene-search", this.el) as HTMLInputElement

    inp.oninput = () => {
      const val = inp.value.trim().toLowerCase()

      this.latestInp = val
      this.sortObjects(val)
    }

    const inpMap = futor("#cutscene-map-search", this.el) as HTMLInputElement

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

      if (!val) return itm.hide(this.currMap !== "all" && itm.mapId !== this.currMap)

      itm.hide(!itmName?.includes(val) || (itm.mapId !== this.currMap && this.currMap !== "all"))
    })
  }
  onCutsceneChosen(x: number, y: number, itm: IObjectTalk[], mapId: string): void {
    if (this.isPicker) return this.destroy(x, y, itm)

    return this.goToUpdateCutscene(x, y, itm, mapId)
  }
  goToUpdateCutscene(x: number, y: number, itm: IObjectTalk[], mapId: string): void {
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
    // const newCutscene = new NewCutscene(itm.x, itm.y, this.editor)
    const newCutscene = new NewCutscene({
      x,
      y,
      events: itm,
      editor: this.editor,
      type: "cutscene"
    })
    newCutscene.onDone((s?: ICutsceneToReturn, isDeleted?: boolean) => {
      this.editor.parseNewCutscene(s, isDeleted)

      const newEditorCutscenes = new EditorCutscenes({
        editor: this.editor,
        isPicker: this.isPicker,
        mapId: this.currMap
      })
      newEditorCutscenes.init()
    })
    this.destroy()
    newCutscene.init()
  }
  onDone(newFunc: (x?: number, y?: number, s?: IObjectTalk[]) => void): void {
    this.onSubmission = newFunc
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(x?: number, y?: number, itm?: IObjectTalk[]): void {
    this.list.forEach((k) => k.destroy())

    this.list.splice(0, this.list.length)
    this.parent.remove()
    if (this.onSubmission) {
      this.onSubmission(x, y, itm)
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
