import { futor, kel, qutor } from "../../../../lib/kel"
import { AssetType, IAny, IAsset, IAssets } from "../../../../types/LibTypes"
import { db } from "../../../data/db"
import { inlineEmpty } from "../../_inlineMsg"
import { FileReplace } from "../../Forms/FileReplace"
import { FileUpload } from "../../Forms/FileUpload"
import { EditorSys } from "../EditorSys"
import { EditorMapsConfig } from "./EditorMaps"

export interface EditorFilesConfig extends EditorMapsConfig {
  sys: EditorSys
}

class FileCard {
  private el!: HTMLDivElement
  private nameEl?: HTMLSpanElement

  name: string = "noname"
  files: EditorFiles
  id: string

  itm: IAsset

  constructor(files: EditorFiles, id: string) {
    this.files = files
    this.id = id
    this.itm = db.assets.find((file) => file.id === id)!
  }
  private createElement(): void {
    this.el = kel("div", "card")
    this.el.innerHTML = `<i class="fa-light fa-${this.itm.type === "audio" ? "music" : "image"} fa-fw"></i>`
    this.updateFile()
  }
  updateFile(): void {
    const itmExtension = this.itm.type === "audio" ? "mp3" : "png"

    const itm = db.assets.find((k) => k.id === this.id)!
    this.itm.id = itm.id
    this.itm.path = itm.path
    this.name = itm.name

    if (!this.nameEl) {
      this.nameEl = kel("span")
      this.el.append(this.nameEl)
    }
    this.nameEl.innerText = `${itm.name}.${itmExtension}`
  }
  onClick(): void {
    this.el.onclick = () => this.files.onFileClick(this.id)
  }
  get html(): HTMLDivElement {
    return this.el
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
  init(): this {
    this.createElement()
    this.onClick()
    return this
  }
}
let currentSort: AssetType | "all" = "all"
let openTime: number = 0

export class EditorFiles {
  locked: boolean = false
  protected el!: HTMLDivElement
  sys!: EditorSys

  protected emptyFile?: HTMLDivElement

  protected list: FileCard[] = []
  protected field!: HTMLDivElement

  protected onDone?: (s?: IAny) => IAny

  protected searchId: number

  constructor(s: EditorFilesConfig) {
    this.sys = s.sys
    this.searchId = ++openTime
  }
  protected createElement(): void {
    this.el = kel("div", "content-files")
    this.el.innerHTML = `
    <div class="file-group">
      <div x-sort="all" class="btn btn-group btn-all">All</div>
      <div x-sort="map" class="btn btn-group btn-maps">Maps</div>
      <div x-sort="object" class="btn btn-group btn-images">Objects</div>
      <div x-sort="audio" class="btn btn-group btn-audio">Audio</div>
    </div>
    <div class="file-find">
      <input type="text" name="inp-file-name-${this.searchId}" id="inp-file-name-${this.searchId}" placeholder="Search File" />
    </div>
    <div class="file-list"></div>
    <div class="file-new">
      <div class="btn btn-new-file"><i class="fa-solid fa-plus"></i> New File</div>
    </div>`
    this.emptyFile = inlineEmpty("-- Empty --")

    this.field = futor(".file-list", this.el) as HTMLDivElement
  }
  protected writeData(): void {
    const sysFiles: IAssets = db.assets

    this.list = sysFiles.map((itm) => new FileCard(this, itm.id).init())
    this.list.forEach((card) => {
      this.field.append(card.html)
    })

    this.sortFiles(currentSort)

    this.checkEmpty()
  }
  addData(data: IAssets): void {
    const newCards = data.map((itm) => new FileCard(this, itm.id).init())
    this.list.push(...newCards)

    newCards.forEach((card) => this.field.append(card.html))

    this.sortFiles(currentSort)

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
  protected groupListener(): void {
    const btnGroups = this.el.querySelectorAll(".file-group .btn-group") as NodeListOf<HTMLDivElement>
    btnGroups.forEach((btn) => {
      btn.onclick = () => {
        if (btn.classList.contains("active")) return
        const newsort = btn.getAttribute("x-sort")! as AssetType | "all"
        currentSort = newsort
        this.sortFiles(newsort)
      }
    })
  }
  onFileClick(fileId: string): void {
    const fileReplace = new FileReplace(fileId).init()
    fileReplace.onDone((itm?: IAsset | string) => {
      if (!itm) return
      const fileCard = this.list.find((k) => k.id === fileId)

      if (typeof itm === "string" && itm === "deleted") {
        fileCard?.destroy()
        return
      }
      fileCard?.updateFile()
    })
  }
  onChosen(nextFunc: (s?: IAny) => IAny): void {
    this.onDone = nextFunc
  }
  protected clickListener(): void {
    const btnNewFile = futor(".file-new .btn-new-file", this.el)
    btnNewFile.onclick = () => {
      this.sys.middle.lock()
      const fileUpload = new FileUpload()
      fileUpload.init()
      fileUpload.onDone((data?: IAssets) => {
        if (data) this.addData(data)
        this.sys.middle.lock(false)
      })
    }
  }
  protected inpSubmit(text: string): void {
    this.sortFiles("all")
    this.list.forEach((itm) => {
      itm.hide(!itm.name.toLowerCase().includes(text.trim().toLowerCase()))
    })
  }
  protected inpListener(): void {
    const inp = futor(`#inp-file-name-${this.searchId}`, this.el) as HTMLInputElement
    inp.oninput = () => this.inpSubmit(inp.value.trim())
  }
  protected sortFiles(sortId?: string): void {
    const btn = futor(`.file-group .btn-group[x-sort="${sortId}"]`, this.el)
    if (btn.classList.contains("active")) return
    const btnActive = qutor(".file-group .btn-group.active", this.el)
    if (btnActive) btnActive.classList.remove("active")
    btn.classList.add("active")

    const assetTypes: AssetType[] = ["map", "object", "audio"]
    if (sortId === "all") {
      this.list.forEach((itm) => itm.hide(false))
    } else if (assetTypes.find((k) => sortId === k)) {
      this.list.forEach((itm) => {
        if (itm.itm.type === sortId) return itm.hide(false)
        itm.hide(true)
      })
    }
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    if (this.sys.middle.locked) return
    this.sys.middle.lock(true)
    this.list = []
    this.el.remove()
    this.sys.middle.lock(false)
  }
  protected extended(): void {}
  init(): this {
    this.createElement()
    this.extended()
    this.writeData()
    this.groupListener()
    this.clickListener()
    this.inpListener()
    return this
  }
}
