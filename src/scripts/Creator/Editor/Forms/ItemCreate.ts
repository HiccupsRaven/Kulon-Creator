import asset from "../../../data/assets"
import { eroot, futor } from "../../../lib/kel"
import modal from "../../../lib/modal"
import { IAny } from "../../../types/LibTypes"
import { db } from "../../data/db"
import { Editor } from "../../Editor"
import { ICloudItem } from "../../types/CreatorTypes"
import { genStringId, toObject, toText } from "../../lib/gen"
import { toCanvasMin } from "../../lib/toCanvasWork"
import { FilePicker } from "./FilePicker"
import { iform } from "./TemplateForm"

export interface ItemCreateConfig {
  editor: Editor
  itm?: ICloudItem
  overWrite?: boolean
}

export class ItemCreate {
  private el!: HTMLFormElement

  locked: boolean = false

  private itm: Partial<ICloudItem>
  private onSubmission?: (s?: ICloudItem) => IAny

  editor: Editor

  private overWrite: boolean = false

  constructor(config: ItemCreateConfig) {
    this.editor = config.editor

    if (config.overWrite) this.overWrite = true

    this.itm = { id: genStringId() }

    if (config.itm) this.itm = toObject(config.itm)
  }
  private createElement(): void {
    const name = this.itm?.name?.id ? `${this.itm.name.id} \\ ${this.itm.name.en}` : ""
    const desc = this.itm?.desc?.id ? `${this.itm.desc.id} \\ ${this.itm.desc.en}` : ""

    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">${this.overWrite ? "Update" : "Create"} In-Game Item</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx center">*Image Source</p>
          <div class="img-item-creation" x-found="obj-src"></div>
          <div class="btn btn-find find-src" x-find="obj-src">Choose Your Asset</div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label for="itm-name">*Name <small>- separate language with \\ (id\\en)</small></label>
            <input type="text" name="itm-name" id="itm-name" placeholder="Cermin Ajaib \\ Magic Mirror" autocomplete="off" maxlength="200" value="${name}" />
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label for="itm-desc">*Description <small>- separate language with \\ (id\\en)</small></label>
            <input type="text" name="itm-desc" id="itm-desc" placeholder="Gantiin cermin toko yang rusak \\ Can be use to replace a broken mirror" autocomplete="off" maxlength="600" value="${desc}" />
          </div>
        </div>
      </div>

      <div class="f">
        <div class="s field-delete${this.overWrite ? "" : " hide"}">
          <div class="btn btn-delete-object">Delete</div>
        </div>
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>`)

    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }
  private async updateImage(src?: string): Promise<void> {
    const isWrongType = db.assets.find((k) => k.id === src)?.type === "audio"

    if (isWrongType) {
      this.locked = true
      await modal.alert("You can only pick image file for the item source")
      this.locked = false
      return
    }

    const preview = futor('[x-found="obj-src"]', this.el)
    while (preview.firstChild) {
      preview.firstChild.remove()
    }

    if (!src && !this.itm.src) return

    if (src) this.itm.src = src

    const canvasImage = toCanvasMin(asset[this.itm.src!].src, 175)

    preview.append(canvasImage)
  }
  private findListener(): void {
    const btnFind = futor(".find-src", this.el)
    btnFind.onclick = () => {
      if (this.locked) return
      this.locked = true
      const filePicker = new FilePicker({ sys: this.editor.middle.sys })
      filePicker.onChosen((fileId?: string) => {
        this.locked = false
        this.hide(false)
        this.updateImage(fileId)
      })
      filePicker.init()
      this.hide()
    }
  }
  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()
      if (this.locked) return
      this.locked = true

      const data: ICloudItem = toObject(this.itm)

      const formData = new FormData(this.el)

      let formFailed: boolean = false

      for (const [keyRaw, val] of formData) {
        const key = keyRaw.replace("itm-", "") as keyof ICloudItem

        if (key === "name" || key === "desc") {
          const text = val.toString().trim()
          if (text.length < 1) {
            formFailed = true
          } else {
            const valArr = text.split("\\")
            const textId = valArr?.[0]?.trim() || text
            const textEn = valArr?.[1]?.trim() || textId

            data[key] = {
              id: textId,
              en: textEn
            }
          }
        }
      }

      if (formFailed || !data.src) {
        await modal.alert("Please fill out all the required field before submitting.")
        this.locked = false
        return
      }

      this.locked = false

      if (!this.overWrite) {
        db.items.push(data)
        this.destroy(data)
        return
      }

      const itmIdx = db.items.findIndex((k) => k.id === this.itm.id)

      if (itmIdx === -1) {
        this.locked = true
        await modal.alert("The item you wanted to update is not found")
        this.locked = false
        return
      }

      db.items[itmIdx].name = data.name
      db.items[itmIdx].desc = data.desc
      db.items[itmIdx].src = data.src
      db.items[itmIdx].group = "0"

      this.destroy(data)
    }
  }

  private deleteListener(): void {
    const btnDelete = futor(".btn-delete-object", this.el)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const confDelete = await modal.confirm(`Delete item ${toText(this.itm.name!.en!)}?`)

      if (!confDelete) {
        this.locked = false
        return
      }

      // const usedIn = checkUsedIn(this.itm.id)
      // if (usedIn.length >= 1) {
      //   const usedInString = usedIn.map((str) => `<li>${toText(str)}</li>`).join("")

      //   const warnMsg = `Item <b>${toText(this.itm.name!.en)}</b> is currently used in your workspace:<ol class="mono">${usedInString}</ol>Can't Delete :)`

      //   await modal.alert(warnMsg)

      //   this.locked = false
      //   return
      // }

      const itemIdx = db.items.findIndex((k) => k.id === this.itm.id)
      if (itemIdx !== -1) db.items.splice(itemIdx, 1)

      this.locked = false

      this.destroy()
    }
  }

  onDone(newFunc: (s?: ICloudItem) => void): void {
    this.onSubmission = newFunc
  }
  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  destroy(itm?: ICloudItem): void {
    this.el.remove()
    if (this.onSubmission) {
      this.onSubmission(itm)
      this.onSubmission = undefined
    }
  }
  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.updateImage()
    this.findListener()
    this.submitListener()
    this.deleteListener()
    return this
  }
}
