import asset from "../../../data/assets"
import { eroot, futor } from "../../../lib/kel"
import modal from "../../../lib/modal"
import { db } from "../../data/db"
import { work } from "../../data/work"
import { IMapConfig } from "../../types/CreatorTypes"
import { genStringId, toObject } from "../../lib/gen"
import { toCanvasMin } from "../../lib/toCanvasWork"
import { EditorSys } from "../Parts/EditorSys"
import { FilePicker } from "./FilePicker"
import { iform } from "./TemplateForm"

export interface NewMapConfiguration {
  sys: EditorSys
  fromId?: string
}

export class NewMap {
  locked: boolean = false
  private el!: HTMLFormElement
  sys: EditorSys
  private fromId?: string

  private mapObject: Partial<IMapConfig> = {}

  constructor(s: NewMapConfiguration) {
    this.sys = s.sys
    this.fromId = s.fromId
  }
  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">New Map</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label for="mapName">*Map Name</label>
            <input type="text" name="mapName" id="mapName" placeholder="ex: My First map" />
          </div>
        </div>
        <div class="i">
          <div class="inp">
            <label for="mapId">Map ID</label>
            <input type="text" name="mapId" id="mapId" placeholder="ex: firstMap69" value="${genStringId()}" readonly />
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx">*Base (Lower Image):</p>
          <div class="img-item-creation" x-found="src1"></div>
          <div class="btn btn-find" x-find="src1">Choose Your Asset</div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx">*Layer (Upper Image):</p>
          <div class="img-item-creation" x-found="src2"></div>
          <div class="btn btn-find" x-find="src2">Choose Your Asset</div>
        </div>
      </div>
      <div class="f submission">
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>`)
  }
  private checkFromId(): void {
    if (!this.fromId) {
      this.mapObject.configObjects = {}
      this.mapObject.cutscenes = {}
      this.mapObject.walls = {}
      return
    }

    const mapData = work[this.fromId]
    if (!mapData) return

    this.mapObject = toObject(mapData)

    this.renderData()
  }
  private renderData(): void {
    const mapName = futor("#mapName", this.el) as HTMLInputElement
    mapName.value = this.mapObject.name!

    const mapId = futor("#mapId", this.el) as HTMLInputElement
    mapId.value = this.mapObject.id!

    this.updateLower(this.mapObject.lowerSrc!)
    this.updateUpper(this.mapObject.upperSrc!)
  }
  private findListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }

    const btnFindBase = futor('[x-find="src1"]', this.el)
    btnFindBase.onclick = () => {
      this.hide()
      const filePicker = new FilePicker({ sys: this.sys }).init()
      filePicker.onChosen((fileId?: string) => {
        this.hide(false)
        if (fileId) this.updateLower(fileId)
      })
    }

    const btnFindLayer = futor('[x-find="src2"]', this.el)
    btnFindLayer.onclick = () => {
      this.hide()
      const filePicker = new FilePicker({ sys: this.sys }).init()
      filePicker.onChosen((fileId?: string) => {
        this.hide(false)
        if (fileId) this.updateUpper(fileId)
      })
    }
  }
  async updateLower(srcId: string): Promise<void> {
    const isWrongType = db.assets.find((k) => k.id === srcId)?.type === "audio"

    if (isWrongType) {
      this.locked = true
      await modal.alert("You can only pick image file to set the base source")
      this.locked = false
      return
    }

    this.mapObject.lowerSrc = srcId
    const previewBase = futor('[x-found="src1"]', this.el)
    while (previewBase.firstChild) {
      previewBase.firstChild.remove()
    }

    const img = toCanvasMin(asset[srcId].src, 175)

    previewBase.append(img)
  }
  async updateUpper(srcId: string): Promise<void> {
    const isWrongType = db.assets.find((k) => k.id === srcId)?.type === "audio"

    if (isWrongType) {
      this.locked = true
      await modal.alert("You can only pick image file to set the layer source")
      this.locked = false
      return
    }

    this.mapObject.upperSrc = srcId
    const previewLayer = futor('[x-found="src2"]', this.el)
    while (previewLayer.firstChild) {
      previewLayer.firstChild.remove()
    }

    const img = toCanvasMin(asset[srcId].src, 175)

    previewLayer.append(img)
  }
  private formListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()
      if (this.locked) return
      this.locked = true

      const mapInp = futor("#mapName", this.el) as HTMLInputElement
      const mapName = mapInp.value.trim()
      if (!mapName || mapName.length < 1) {
        await modal.alert("Please fill out all the required fields (*)")
        this.locked = false
        return
      }

      if (!this.mapObject.lowerSrc || !this.mapObject.upperSrc) {
        await modal.alert("Please pick images for base and layer (*)")
        this.locked = false
        return
      }

      if (!this.mapObject.id) this.mapObject.id = genStringId()

      const mapConfig = this.mapObject as IMapConfig
      mapConfig.name = mapName

      work[this.mapObject.id] = mapConfig

      this.destroy(mapConfig)
    }
  }
  hide(newStatus: boolean = true): void {
    if (newStatus) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  destroy(mapConfig?: IMapConfig): void {
    this.fromId = undefined
    this.el.remove()
    this.sys.middle.lock(false)
    if (mapConfig) this.sys.middle.editor.parseNewMap(mapConfig.id)
  }
  init(): this {
    this.createElement()
    this.checkFromId()
    this.findListener()
    this.formListener()
    eroot().append(this.el)
    return this
  }
}
