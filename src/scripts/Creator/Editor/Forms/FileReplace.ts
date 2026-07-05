import { eroot, futor, kel } from "../../../lib/kel"
import LoadAssets from "../../../lib/LoadAssets"
import modal from "../../../lib/modal"
import { IAny, IAsset } from "../../../types/LibTypes"
import { db } from "../../data/db"
import EVENT_LIST from "../../data/eventList"
import { work } from "../../data/work"
import { toText } from "../../lib/gen"
import { addToGlobalUrl } from "../../../lib/globalURL"
import { idb } from "../../../lib/idb"
import { toCanvasMin } from "../../lib/toCanvasWork"
import { IAddedReplaceFile, IReplaceFile } from "../../../types/IndexedDbTypes"
import { iform } from "./TemplateForm"

function checkExtension(filename: string): string {
  const extension = filename.slice(filename.lastIndexOf("."))
  return extension.toLowerCase()
}

function checkUsedIn(id: string): string[] {
  const usedIn: string[] = []

  Object.keys(work).forEach((mKey) => {
    const map = work[mKey]
    if (map.lowerSrc === id) usedIn.push(`Base image source of Map \`${map.name}\``)
    if (map.upperSrc === id) usedIn.push(`Layer image source of Map \`${map.name}\``)
    if (map.ambience === id) usedIn.push(`Ambience sound of Map \`${map.name}\``)

    Object.keys(map.configObjects).forEach((cKey) => {
      const obj = map.configObjects[cKey]
      if (obj.src === id) usedIn.push(`Image source of Object \`${obj.name}\` on Map \`${map.name}\` (${obj.x}, ${obj.y})`)

      obj.drops?.forEach((evt) => {
        evt.events.forEach((k, evtIdx) => {
          if (k.src === id) {
            const evtName = EVENT_LIST.find((itm) => itm.id === k.type)!.name

            const idxText = `#${evtIdx + 1}`

            usedIn.push(`Source of Event ${idxText} \`${evtName}\` after got drop from Object \`${obj.name}\` on Map \`${map.name}\` (${obj.x}, ${obj.y})`)
          }
        })
      })

      obj.talk?.forEach((evt) => {
        evt.events.forEach((k, evtIdx) => {
          if (k.src === id) {
            const evtName = EVENT_LIST.find((itm) => itm.id === k.type)!.name

            const idxText = `#${evtIdx + 1}`

            usedIn.push(`Source of Event ${idxText} \`${evtName}\` by interacting to Object \`${obj.name}\` on Map \`${map.name}\` (${obj.x}, ${obj.y})`)
          }
        })
      })
    })

    Object.keys(map.cutscenes).forEach((cKey) => {
      const space = map.cutscenes[cKey]

      const coor = cKey.split(",").join(", ")

      space.forEach((evt) => {
        evt.events.forEach((k, evtIdx) => {
          if (k.src === id) {
            const evtName = EVENT_LIST.find((itm) => itm.id === k.type)!.name

            const idxText = `#${evtIdx + 1}`

            usedIn.push(`Source of Event ${idxText} \`${evtName}\` by triggering a Cutscene at Tile \`${coor}\` on Map \`${map.name}\``)
          }
        })
      })
    })
  })

  db.startend.start?.forEach((k, evtIdx) => {
    if (k.src === id) {
      const evtName = EVENT_LIST.find((itm) => itm.id === k.type)!.name

      const idxText = `#${evtIdx + 1}`

      usedIn.push(`Source of Event ${idxText} \`${evtName}\` after triggering the starting events`)
    }
  })

  db.startend.end?.forEach((k, evtIdx) => {
    if (k.src === id) {
      const evtName = EVENT_LIST.find((itm) => itm.id === k.type)!.name

      const idxText = `#${evtIdx + 1}`

      usedIn.push(`Source of Event ${idxText} \`${evtName}\` after triggering the ending events`)
    }
  })

  db.items.forEach((item) => {
    if (item.src === id) {
      usedIn.push(`Image source of Item \`${item.name.id} \\ ${item.name.en}\``)
    }
  })

  return usedIn
}

const OBJECT_URLS: string[] = []

export class FileReplace {
  locked: boolean = false
  private el!: HTMLFormElement
  private onCallback?: (s?: IAny) => void

  private addedFiles: IAddedReplaceFile

  private groups!: HTMLDivElement

  private fileId: string
  private itm: IAsset

  constructor(fileId: string) {
    this.fileId = fileId
    this.itm = db.assets.find((itm) => itm.id === fileId)!
    this.addedFiles = {
      id: fileId,
      type: this.itm.type,
      name: this.itm.name
    }
  }
  private createElement(): void {
    const acceptType = this.itm.type === "audio" ? ".mp3, audio/mpeg" : ".png, image/png"

    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">Replace Files</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label class="btn btn-file" for="fileUpload">Choose Files</label>
            <input type="file" name="fileUpload" id="fileUpload" accept="${acceptType}" />
            <div class="groups"></div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>
    `)

    this.groups = futor(".groups", this.el) as HTMLDivElement

    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }
  private writeDefault(): void {
    if (this.itm.type === "audio") {
      this.createAudio()
    } else {
      this.createImage()
    }
  }
  private async createImage(file?: File): Promise<void> {
    let fileSrc = this.itm.path

    if (file) {
      const newSrc = URL.createObjectURL(file)
      OBJECT_URLS.push(newSrc)

      fileSrc = newSrc

      this.addedFiles.file = file
    }

    while (this.groups.firstChild) {
      this.groups.firstChild.remove()
    }

    const field = kel("div", `f p file-preview file-${this.fileId}`)
    field.innerHTML = `
    <div class="i">
      <div class="img-item-creation" x-found="obj-src"></div>
      <div class="inp">
        <input type="text" name="name-${this.fileId}" id="name-${this.fileId}" value="${this.addedFiles.name}" />
        <div class="file-actions">
          <a class="btn btn-see-full" href="${fileSrc}" target="_blank"><i class="fa-light fa-up-right-from-square fa-fw"></i> See Full Image</a>
          <span class="btn btn-delete"><i class="fa-solid fa-trash-can"></i> Delete</span>
        </div>
      </div>
    </div>`

    const imgPreview = futor(".img-item-creation", field)
    imgPreview.append(toCanvasMin(fileSrc, 120))

    const inpName = futor(`#name-${this.fileId}`, field) as HTMLInputElement

    const btnDelete = futor(".btn-delete", field)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const msgConfirm = toText(`Delete ${inpName.value}.png?`)
      const confDel = await modal.confirm(msgConfirm)

      if (!confDel) {
        this.locked = false
        return
      }

      this.locked = false

      this.deleteFile()
    }

    this.groups.append(field)
  }
  private async createAudio(file?: File): Promise<void> {
    let fileSrc = this.itm.path

    if (file) {
      const newSrc = URL.createObjectURL(file)
      OBJECT_URLS.push(newSrc)

      fileSrc = newSrc

      this.addedFiles.file = file
    }

    while (this.groups.firstChild) {
      this.groups.firstChild.remove()
    }

    const field = kel("div", `f p file-${this.fileId}`)
    field.innerHTML = `<div class="i">
      <div class="inp">
        <audio src="${fileSrc}" controls>Your browser does not support the audio element.</audio>
        <input type="text" name="name-${this.fileId}" id="name-${this.fileId}" value="${this.addedFiles.name}" />
        <span class="btn btn-delete"><i class="fa-solid fa-trash-can"></i> Delete</span>
      </div>
    </div>`

    const inpName = futor(`#name-${this.fileId}`, field) as HTMLInputElement

    const btnDelete = futor(".btn-delete", field)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const msgConfirm = toText(`Delete ${inpName.value}.mp3?`)

      const confDel = await modal.confirm(msgConfirm)

      if (!confDel) {
        this.locked = false
        return
      }

      this.locked = false

      this.deleteFile()
    }

    this.groups.append(field)
  }
  private uploadListener(): void {
    const inp = futor("#fileUpload", this.el) as HTMLInputElement
    inp.onchange = () => {
      const file = inp.files?.[0]
      if (!file) return

      const inpName = futor(`#name-${this.fileId}`, this.el) as HTMLInputElement
      this.addedFiles.name = inpName.value

      this.parseFiles(file)
    }
  }
  private parseFiles(file: File): void {
    const ext = checkExtension(file.name)

    if (this.itm.type === "audio" && ext !== ".mp3") return
    if ((this.itm.type === "map" || this.itm.type === "object") && ext !== ".png") return

    if (ext === ".png") {
      this.createImage(file)
    } else if (ext === ".mp3") {
      this.createAudio(file)
    }
  }

  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()

      if (this.locked) return
      this.locked = true

      const inpName = futor(`#name-${this.fileId}`, this.el) as HTMLInputElement
      const fileName = inpName.value
      if (!fileName || fileName.length < 1) {
        await modal.alert("Please fill out all the required field before uploading.")
        this.locked = false
        return
      }
      this.addedFiles.name = fileName
      this.sendToServer()
    }
  }
  private async sendToServer(): Promise<void> {
    const fileToUp: IReplaceFile = {
      id: this.fileId,
      name: this.addedFiles.name,
      type: this.itm.type,
      file: this.addedFiles.file
    }

    if (fileToUp.name === this.itm.name && !fileToUp.file) {
      this.locked = false
      this.destroy()
      return
    }
    const id = db.meta.id

    const fileUp = await modal.loading(idb.replaceFile(id, fileToUp))

    const fileReturn = fileUp.file
    const fileDupe = fileUp.dupe

    if (!fileReturn && !fileDupe) {
      await modal.alert("File ID is not found")
      this.locked = false
      return
    }

    if (fileDupe) {
      const warnMsg = `You already had other file named ${fileDupe}.`
      await modal.alert(warnMsg)
      this.locked = false
      return
    }

    const assetIdx = db.assets.findIndex((k) => k.id === fileReturn.id)

    const sanitizeAssets = await addToGlobalUrl(id, [fileReturn])

    if (assetIdx !== -1) {
      db.assets[assetIdx].name = sanitizeAssets[0].name
      db.assets[assetIdx].path = sanitizeAssets[0].path
    }

    await modal.loading(new LoadAssets({ files: sanitizeAssets }).run())

    this.locked = false
    this.destroy(fileReturn)
  }
  private async deleteFile(): Promise<void> {
    if (this.locked) return
    this.locked = true

    const usedIn = checkUsedIn(this.fileId)

    if (usedIn.length >= 1) {
      const usedInString = usedIn.map((str) => `<li>${toText(str)}</li>`).join("")

      const warnMsg = `File ${this.addedFiles.name} is currently used in your workspace:<ol class="mono">${usedInString}</ol>Can't Delete :)`

      await modal.alert(warnMsg)

      this.locked = false
      return
    }

    const id = db.meta.id

    await modal.loading(idb.deleteFile(id, this.fileId))

    const fileIdx = db.assets.findIndex((itm) => itm.id === this.fileId)
    if (fileIdx !== -1) db.assets.splice(fileIdx, 1)

    this.locked = false
    this.destroy("deleted")
  }
  destroy(fileReturn?: IAsset | string): void {
    this.el.remove()
    if (this.onCallback) {
      this.onCallback(fileReturn)
      this.onCallback = undefined
    }
    OBJECT_URLS.forEach((url) => URL.revokeObjectURL(url))
    OBJECT_URLS.splice(0, OBJECT_URLS.length)
  }
  onDone(nextFunc?: (s?: IAny) => void): void {
    this.onCallback = nextFunc
  }
  init(): this {
    this.createElement()
    this.writeDefault()
    this.uploadListener()
    this.submitListener()
    eroot().append(this.el)
    return this
  }
}
