import { eroot, futor, kel } from "../../../lib/kel"
import LoadAssets from "../../../lib/LoadAssets"
import modal from "../../../lib/modal"
import { AssetType, IAny } from "../../../types/LibTypes"
import { db } from "../../data/db"
import { IAssets } from "../../../types/LibTypes"
import { genStringId, sanitizeName, toText } from "../../lib/gen"
import { iform } from "./TemplateForm"
import { toCanvasMin } from "../../lib/toCanvasWork"
import { IAddedFile, IFileForm, ISendFile } from "../../../types/IndexedDbTypes"
import { idb } from "../../../lib/idb"
import { addToGlobalUrl } from "../../../lib/globalURL"

function checkExtension(filename: string): string {
  const extension = filename.slice(filename.lastIndexOf("."))
  return extension.toLowerCase()
}

const OBJECT_URLS: string[] = []

export class FileUpload {
  locked: boolean = false
  private el!: HTMLFormElement
  private onCallback?: (s?: IAny) => void

  private addedFiles: IAddedFile[] = []

  private groups!: HTMLDivElement

  constructor() {}
  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">Upload Files</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label class="btn btn-file" for="fileUpload">Add Files</label>
            <input type="file" name="fileUpload" id="fileUpload" accept=".mp3, .png, audio/mpeg, image/png" multiple />
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
  private uploadListener(): void {
    const inp = futor("#fileUpload", this.el) as HTMLInputElement
    inp.onchange = () => {
      const files = inp.files
      if (!files || files.length < 1) return
      this.parseFiles(files)
      inp.value = ""
    }
    inp.click()
  }
  private parseFiles(files: FileList): void {
    for (const file of files) {
      const ext = checkExtension(file.name)
      if (ext === ".png") {
        this.createImageField(file)
      } else if (ext === ".mp3") {
        this.createAudioField(file)
      }
    }
  }
  private async createImageField(file: File): Promise<void> {
    const fileExist = this.addedFiles.find((k) => {
      return file.name === k.file.name && file.size === k.file.size && file.lastModified === k.file.lastModified && file.type === k.file.type
    })
    if (fileExist) return

    const fileSrc = URL.createObjectURL(file)

    OBJECT_URLS.push(fileSrc)

    const filename = sanitizeName(file.name)

    const fileId = genStringId()
    const field = kel("div", `f p file-preview file-${fileId}`)

    const fileObj: IAddedFile = {
      id: fileId,
      name: filename,
      file,
      type: "map",
      field: field
    }

    this.addedFiles.push(fileObj)

    field.innerHTML = `
    <div class="i">
      <div class="img-item-creation" x-found="obj-src"></div>
      <div class="inp">
        <input type="text" name="name-${fileId}" id="name-${fileId}" value="${filename}" />
        <div class="f p">
          <div class="i">
            <div class="radio">
              <label for="map-${fileId}">
                <input type="radio" name="image-type-${fileId}" id="map-${fileId}" value="map" checked />
                <span>For Maps</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="object-${fileId}">
                <input type="radio" name="image-type-${fileId}" id="object-${fileId}" value="object" />
                <span>For Objects</span>
              </label>
            </div>
          </div>
        </div>
        <div class="file-actions">
          <span class="btn btn-delete"><i class="fa-solid fa-trash-can"></i> Delete</span>
        </div>
      </div>
    </div>`

    const imgPreview = futor(".img-item-creation", field)
    imgPreview.append(toCanvasMin(fileSrc, 120))

    const inpName = futor(`#name-${fileId}`, field) as HTMLInputElement

    const btnDelete = futor(".btn-delete", field)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const msgConfigm = toText(`Remove ${inpName.value}.png?`)
      const confDel = await modal.confirm(msgConfigm)

      if (!confDel) {
        this.locked = false
        return
      }

      const insertIndex = this.addedFiles.findIndex((k) => k.id === fileId)
      if (insertIndex === -1) {
        this.locked = false
        return
      }
      this.addedFiles[insertIndex].field.remove()

      this.addedFiles.splice(insertIndex, 1)
      this.locked = false
    }

    this.groups.prepend(field)
  }
  private async createAudioField(file: File): Promise<void> {
    const fileExist = this.addedFiles.find((k) => {
      return file.name === k.file.name && file.size === k.file.size && file.lastModified === k.file.lastModified && file.type === k.file.type
    })
    if (fileExist) return

    const fileSrc = URL.createObjectURL(file)

    OBJECT_URLS.push(fileSrc)

    const filename = sanitizeName(file.name)
    const fileId = genStringId()

    const field = kel("div", `f p file-preview file-${fileId}`)

    const fileObj: IAddedFile = {
      id: fileId,
      name: filename,
      file,
      type: "audio",
      field: field
    }

    this.addedFiles.push(fileObj)

    field.innerHTML = `
    <div class="i">
      <div class="inp">
        <audio src="${fileSrc}" controls>Your browser does not support the audio element.</audio>
        <input type="text" name="name-${fileId}" id="name-${fileId}" value="${filename}" />
        <div class="file-actions">
          <span class="btn btn-delete"><i class="fa-solid fa-trash-can"></i> Delete</span>
        </div>
      </div>
    </div>`

    const inpName = futor(`#name-${fileId}`, field) as HTMLInputElement

    const btnDelete = futor(".btn-delete", field)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const msgConfigm = toText(`Remove ${inpName.value}.mp3?`)

      const confDel = await modal.confirm(msgConfigm)

      if (!confDel) {
        this.locked = false
        return
      }

      const insertIndex = this.addedFiles.findIndex((k) => k.id === fileId)
      if (insertIndex === -1) {
        this.locked = false
        return
      }
      this.addedFiles[insertIndex].field.remove()

      this.addedFiles.splice(insertIndex, 1)
      this.locked = false
    }

    this.groups.prepend(field)
  }
  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()

      if (this.locked) return
      this.locked = true

      const tempData: Record<string, IFileForm> = {}

      const formData = new FormData(this.el)
      formData.delete("fileUpload")
      for (const [key, val] of formData) {
        if (key.includes("name-")) {
          const dataKey = key.replace("name-", "")
          if (!tempData[dataKey]) tempData[dataKey] = {}
          tempData[dataKey].name = val.toString()
        }

        if (key.includes("image-type-")) {
          const dataKey = key.replace("image-type-", "")
          if (!tempData[dataKey]) tempData[dataKey] = {}
          tempData[dataKey].type = val.toString() as AssetType
        }
      }

      const errorIds: string[] = []

      Object.keys(tempData).forEach((k: IAddedFile["id"]) => {
        const data = tempData[k]
        const file = this.addedFiles.find((itm) => itm.id === k)

        if (!file) return

        if (data.type) file.type = data.type
        if (!data.name || data.name.length < 1) {
          errorIds.push(k)
        }
        if (data.name) file.name = data.name
      })

      if (errorIds.length >= 1) {
        await modal.alert("Please fill out all the required field before uploading.")
        this.locked = false
        return
      }
      this.sendToServer()
    }
  }
  private async sendToServer(): Promise<void> {
    const filesToUp: ISendFile[] = this.addedFiles.map((itm) => ({
      id: itm.id,
      name: itm.name,
      type: itm.type,
      // base64: itm.base64
      file: itm.file
    }))

    const id = db.meta.id

    const fileUp = await modal.loading(idb.uploadFiles(id, filesToUp))

    const fileReturn = fileUp.files as IAssets
    const fileDupes = fileUp.dupes as string[]

    if (fileDupes.length >= 1) {
      const dupeString = fileDupes.map((str, i) => `${i + 1}. ${str}`).join("<br/>")
      const warnMsg = `You already had the dupe(s) of ${fileDupes.length} file(s).<br/>Aborted File(s):<div class="mono">${dupeString}</div>Want to replace/update files? Go to "Files" menu and select any file you wanted to overwrite.`
      await modal.alert(warnMsg)
    }

    const sanitizeAssets = await addToGlobalUrl(id, fileReturn)

    db.assets.push(...sanitizeAssets)

    await modal.loading(new LoadAssets({ files: sanitizeAssets }).run())

    this.locked = false
    this.destroy(sanitizeAssets)
  }
  destroy(fileReturn?: IAssets): void {
    OBJECT_URLS.forEach((url) => URL.revokeObjectURL(url))
    OBJECT_URLS.splice(0, OBJECT_URLS.length)

    this.el.remove()

    if (this.onCallback) {
      this.onCallback(fileReturn)
      this.onCallback = undefined
    }
  }
  onDone(nextFunc?: (s?: IAny) => void): void {
    this.onCallback = nextFunc
  }
  init(): this {
    this.createElement()
    this.uploadListener()
    this.submitListener()
    eroot().append(this.el)
    return this
  }
}
