import { sound } from "../../../../data/sound"
import { eroot, futor } from "../../../../lib/kel"
import modal from "../../../../lib/modal"
import { db } from "../../../data/db"
import { work } from "../../../data/work"
import { IMapConfig } from "../../../types/CreatorTypes"
import { FilePicker } from "../../Forms/FilePicker"
import { iform } from "../../Forms/TemplateForm"
import { toText } from "../../../lib/gen"
import { ConfigMap } from "./ConfigMap"

export interface AmbienceConfig {
  ambience: IMapConfig["ambience"]
  confMap: ConfigMap
}

export class AmbienceSelect {
  locked: boolean = false
  private el!: HTMLFormElement

  private onSubmission?: (s?: IMapConfig["ambience"], isDeleted?: boolean) => void

  private ambience?: IMapConfig["ambience"]
  private ambName?: string

  confMap: ConfigMap

  constructor(config: AmbienceConfig) {
    this.ambience = config.ambience
    if (config.ambience) this.ambName = db.assets.find((k) => k.id === config.ambience)?.name
    this.confMap = config.confMap
  }

  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">Ambience</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx center">Play a looping ambience sound on the selected map</p>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label for="placeholder-ambience">*Ambience Sound</label>
            <input type="text" name="placeholder-ambience" id="placeholder-ambience" autocomplete="off" value="${this.ambName || "- No Ambience Sound"}" readonly />
            <input class="hide" type="text" name="ambience" id="ambience" autocomplete="off" 
            value="${this.ambience || ""}" readonly />
            <div class="audio-preview" x-found="obj-src"></div>
            <div class="btn btn-find find-ambience">Pick to Assign Audio</div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="s">
          <div class="btn btn-delete-object">Delete</div>
        </div>
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>`)
    if (this.ambience) this.updateAudio(this.ambience)
  }

  private async updateAudio(src: string): Promise<void> {
    const audioFile = db.assets.find((k) => k.id === src)

    if (!audioFile || audioFile.type !== "audio") {
      this.locked = true
      await modal.alert("You can only pick audio file for the ambience source")
      this.locked = false
      return
    }

    const audioName = futor("#placeholder-ambience", this.el) as HTMLInputElement
    audioName.value = audioFile.name

    const audioPreview = futor(".audio-preview", this.el)
    while (audioPreview.firstChild) {
      audioPreview.firstChild.remove()
    }

    this.ambience = src

    const audio = new Audio()
    audio.src = sound[src].src
    audio.controls = true
    audio.innerHTML = "Your browser does not support the audio element."

    audioPreview.append(audio)
  }

  private findListener(): void {
    const btnFind = futor(".find-ambience", this.el)
    btnFind.onclick = () => {
      if (this.locked) return
      this.locked = true
      const filePicker = new FilePicker({ sys: this.confMap.conf.middle.sys })
      filePicker.onChosen((fileId?: string) => {
        this.locked = false
        this.hide(false)
        if (fileId) this.updateAudio(fileId)
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

      const data: Record<string, string> = {}

      const formData = new FormData(this.el)

      for (const [key, val] of formData) {
        data[key] = val.toString()
      }

      this.locked = false

      const newAmbSound = this.ambience

      this.destroy(newAmbSound, !newAmbSound)
    }
  }

  private deleteListener(): void {
    const btnDelete = futor(".btn-delete-object", this.el)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      if (!this.ambience) {
        this.locked = false
        this.destroy()
        return
      }

      const mapName = work[this.confMap.conf.middle.editor.curMap!].name
      const confMsg = `Unassign ambience sound from Map \`${toText(mapName)}\`?`

      const confDelete = await modal.confirm(confMsg)
      if (!confDelete) {
        this.locked = false
        return
      }

      this.destroy(this.ambience, true)
    }
  }

  onDone(newFunc: (s?: IMapConfig["ambience"], isDeleted?: boolean) => void): void {
    this.onSubmission = newFunc
  }

  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }

  private closeListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }

  destroy(ambSound?: IMapConfig["ambience"], isDeleted?: boolean): void {
    this.el.remove()
    if (this.onSubmission) {
      this.onSubmission(ambSound, isDeleted)
      this.onSubmission = undefined
    }
    this.ambience = undefined
  }

  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.findListener()
    this.submitListener()
    this.deleteListener()
    this.closeListener()
    return this
  }
}
