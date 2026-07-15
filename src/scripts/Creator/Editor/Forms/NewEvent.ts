import { eroot, futor } from "../../../lib/kel"
import modal from "../../../lib/modal"
import { IAny } from "../../../types/LibTypes"
import { EventForms } from "../../data/EventForms"
import { Editor } from "../../Editor"
import { DirectionType, IEventType, ILocale, IObjectEvent } from "../../types/CreatorTypes"
import { genStringId } from "../../lib/gen"
import { iform } from "./TemplateForm"

type IOptionsWrapper = Record<string, { text?: ILocale; pass?: boolean }>

type IWalkWrapper = Record<string, { who?: string; direction?: DirectionType }>

export class NewEvent {
  locked: boolean = false
  private el!: HTMLFormElement

  private onSubmission?: (s?: IObjectEvent) => IAny

  constructor(
    public editor: Editor,
    readonly evt: IEventType,
    public itm?: IObjectEvent,
    public itms?: IObjectEvent[]
  ) {}

  createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">${this.evt.name}</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="groups group-renderer"></div>
      <div class="f">
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>`)

    const groupRenderer = futor(".group-renderer", this.el)

    const getFields = EventForms[this.evt.id](this, this.itm)
    if (typeof getFields === "string") {
      groupRenderer.innerHTML = getFields
    } else {
      groupRenderer.replaceWith(getFields)
    }
  }
  cancelListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }
  submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()

      if (this.locked) return
      this.locked = true

      const formData = new FormData(this.el)

      const data: Partial<IObjectEvent> = {
        n: this.itm?.n || genStringId(),
        type: this.itm?.type || this.evt.id
      }

      const pagesWrapper: IObjectEvent["pages"] = []

      const optionsWrapper: IOptionsWrapper = {}

      const walksWrapper: IWalkWrapper = {}

      for (const [keyRaw, inpVal] of formData) {
        const val = inpVal.toString().trim()

        const key = keyRaw.replace("evt-", "") as keyof IObjectEvent
        if (key === "action" || key === "map" || key === "which" || key === "src" || key === "id" || key === "who") {
          data[key] = val
        } else if (key === "amount" || key === "idx" || key === "x" || key === "y" || key === "time") {
          data[key] = Number(val)
        } else if (key === "door" || key === "instant" || key === "noCancel" || key === "crew" || key === "first") {
          data[key] = val === "true"
        } else if (key === "direction") {
          data["direction"] = val as DirectionType
        } else if (key === "name" || key === "text") {
          const valArr = val?.split("\\")
          const valId = valArr?.[0]?.trim() || val
          const valEn = valArr?.[1]?.trim() || valId

          data[key] = { id: valId, en: valEn }
        } else if (key === "states" || key === "winners") {
          data[key] = val.split(",").map((txt) => txt.trim())
        } else if (key.includes("pages-")) {
          const valArr = val?.split("\\")
          const valId = valArr?.[0]?.trim() || val
          const valEn = valArr?.[1]?.trim() || valId

          pagesWrapper.push({ id: valId, en: valEn })
        } else if (key.includes("options-text-")) {
          const valArr = val?.split("\\")
          const valId = valArr?.[0]?.trim() || val
          const valEn = valArr?.[1]?.trim() || valId

          const optId = key.replace("options-text-", "")
          if (!optionsWrapper[optId]) optionsWrapper[optId] = {}
          optionsWrapper[optId].text = { id: valId, en: valEn }
        } else if (key.includes("options-cancel-")) {
          const optId = key.replace("options-cancel-", "")
          if (!optionsWrapper[optId]) optionsWrapper[optId] = {}
          optionsWrapper[optId].pass = val === "true"
        } else if (key.includes("who-")) {
          const whoId = key.replace("who-", "")
          if (!walksWrapper[whoId]) walksWrapper[whoId] = {}
          walksWrapper[whoId].who = val
        } else if (key.includes("direction-")) {
          const dirId = key.replace("direction-", "")
          if (!walksWrapper[dirId]) walksWrapper[dirId] = {}
          walksWrapper[dirId].direction = val as DirectionType
        }
      }

      if (pagesWrapper.length >= 1) {
        data["pages"] = pagesWrapper
      }

      const options: IObjectEvent["options"] = Object.values(optionsWrapper)
        .filter((k) => k.text?.id && k.text.en)
        .map((k) => ({ text: k.text!, pass: k.pass }))

      if (options.length >= 1) {
        data["options"] = options
      }

      const walks: IObjectEvent["walk"] = Object.values(walksWrapper)
        .filter((k) => k.direction && k.who)
        .map((k) => ({ who: k.who, direction: k.direction }))

      if (walks.length >= 1) {
        data["walk"] = walks
      }

      if (data.type === "addItem" && !data.id) {
        await modal.alert("Please select 1 <b>Item</b>!")
        this.locked = false
        return
      }

      if (data.type === "teleport" && !data.who) {
        await modal.alert("Please select 1 <b>Object</b>!")
        this.locked = false
        return
      }

      if (data.type === "stand" && !data.who) {
        await modal.alert("Please select 1 <b>Person</b>!")
        this.locked = false
        return
      }

      if (data.type === "walk" && (!data.walk || data.walk.length < 1)) {
        await modal.alert("Please select at least 1 <b>Person</b>")
        this.locked = false
        return
      }

      if (data.type === "playSound" && !data.src) {
        await modal.alert("Please select 1 <b>Audio</b>!")
        this.locked = false
        return
      }

      if (data.type === "changeMap" && !data.map) {
        await modal.alert("Please select 1 <b>Map</b>!")
        this.locked = false
        return
      }

      if (data.type === "removeObjectives") {
        data.type = "objectives"
        if (data.text && (!data.text.en || data.text.en.length < 1 || !data.text.id || data.text.id.length < 1)) {
          data.text = undefined
          delete data.text
        }
      }

      this.locked = false

      this.destroy(data as IObjectEvent)
    }
  }
  onDone(newFunc: (s: IAny) => void): void {
    this.onSubmission = newFunc
  }
  lock(status: boolean = true): void {
    this.locked = status
  }
  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  destroy(data?: IObjectEvent): void {
    this.el.remove()
    if (this.onSubmission) {
      this.onSubmission(data)
      this.onSubmission = undefined
    }
  }
  init(): void {
    this.createElement()
    eroot().append(this.el)
    this.cancelListener()
    this.submitListener()
    this.submitListener()
  }
}
