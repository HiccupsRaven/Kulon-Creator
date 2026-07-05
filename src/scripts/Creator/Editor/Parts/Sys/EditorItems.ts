import asset from "../../../../data/assets"
import { eroot, futor, kel } from "../../../../lib/kel"
import { IAny } from "../../../../types/LibTypes"
import { db } from "../../../data/db"
import { Editor } from "../../../Editor"
import { ICloudItem } from "../../../types/CreatorTypes"
import { inlineEmpty } from "../../_inlineMsg"
import { ItemCreate } from "../../Forms/ItemCreate"
import { windowed } from "../../Forms/Windowed"
import { toCanvasMax } from "../../../lib/toCanvasWork"

class ChooserCard {
  private el!: HTMLDivElement

  private chooser: EditorItems

  readonly itm: ICloudItem
  readonly id: ICloudItem["id"]
  readonly name: ICloudItem["name"]
  readonly desc: ICloudItem["desc"]
  readonly src: ICloudItem["src"]
  constructor(itm: ICloudItem, editorItems: EditorItems) {
    this.chooser = editorItems
    this.itm = itm
    this.id = itm.id
    this.name = itm.name
    this.desc = itm.desc
    this.src = itm.src
  }
  private createElement(): void {
    this.el = kel("div", "card")
    this.el.innerHTML = `
    <div class="ic"></div>
    <div class="text">
      <p class="text-name">[en] ${this.name.en}</p>
      <p class="text-sub">${this.desc.en}</p>
    </div>`
  }
  private setPreview(): void {
    const ic = futor(".ic", this.el)

    const img = toCanvasMax(asset[this.src].src, 75)

    ic.append(img)
  }
  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  private onClick(): void {
    this.el.onclick = () => this.chooser.onItemChosen(this.itm)
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

export class EditorItems {
  locked: boolean = false
  private el!: HTMLDivElement
  private parent!: HTMLDivElement

  list: ChooserCard[] = []

  protected emptyFile?: HTMLDivElement

  protected field!: HTMLDivElement

  private onSubmission?: (s?: ICloudItem) => IAny

  private isPicker: boolean

  editor: Editor

  constructor(editor: Editor, isPicker?: boolean) {
    this.isPicker = isPicker || false
    this.editor = editor
  }
  createElement(): void {
    this.el = kel("div", "event-chooser")
    this.el.innerHTML = `
    <div class="chooser-title">${this.isPicker ? "Choose Item" : "Item List"}</div>
    <div class="chooser-list">
      <div class="card-search">
        <input type="text" name="item-search" id="item-search" placeholder="Search Item" />
      </div>
    </div>
    <div class="chooser-actions">
      <div class="btn btn-cancel"><i class="fa-regular fa-arrow-left"></i> Back</div>
      <div class="btn btn-new-item"><i class="fa-solid fa-plus"></i> New Item</div>
    </div>`

    this.field = futor(".chooser-list", this.el) as HTMLDivElement
  }
  private writeData(): void {
    const field = futor(".chooser-list", this.el)

    db.items.forEach((itm) => {
      const card = new ChooserCard(itm, this).init()
      field.append(card.html)
      this.list.push(card)
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
    const inp = futor("#item-search", this.el) as HTMLInputElement

    inp.oninput = () => {
      const val = inp.value.trim().toLowerCase()

      this.list.forEach((itm) => {
        const nameId = itm.name.id.toLowerCase()
        const nameEn = itm.name.en.toLowerCase()

        itm.hide(!nameId.includes(val) && !nameEn.includes(val))
      })
    }
  }
  private itemNewListener(): void {
    const btnNewItem = futor(".btn-new-item", this.el)
    btnNewItem.onclick = () => {
      const onDone = this.onSubmission
      const itemCreate = new ItemCreate({ editor: this.editor })
      itemCreate.init()
      itemCreate.onDone(() => {
        const editorItem = new EditorItems(this.editor)
        if (onDone) editorItem.onDone(onDone)
        editorItem.init()
      })

      this.onSubmission = undefined
      this.destroy()
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
  onItemChosen(itm: ICloudItem): void {
    if (this.isPicker) return this.destroy(itm)

    const onDone = this.onSubmission
    const itemCreate = new ItemCreate({ editor: this.editor, itm, overWrite: true })
    itemCreate.init()
    itemCreate.onDone(() => {
      const editorItem = new EditorItems(this.editor)
      if (onDone) editorItem.onDone(onDone)
      editorItem.init()
    })

    this.onSubmission = undefined
    this.destroy()
  }
  onDone(newFunc: (s?: ICloudItem) => void): void {
    this.onSubmission = newFunc
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(itm?: ICloudItem): void {
    this.list.splice(0, this.list.length)
    this.parent.remove()
    if (this.onSubmission) {
      this.onSubmission(itm)
      this.onSubmission = undefined
    }
  }
  init(): this {
    this.createElement()
    this.parent = windowed(this.el)
    eroot().append(this.parent)
    this.writeData()
    this.searchListener()
    this.cancelListener()
    this.itemNewListener()
    return this
  }
}
