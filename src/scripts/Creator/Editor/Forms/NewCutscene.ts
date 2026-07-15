import EVENT_LIST from "../../data/eventList"
import { eroot, futor, kel } from "../../../lib/kel"
import modal from "../../../lib/modal"
import { IAny } from "../../../types/LibTypes"
import { Editor } from "../../Editor"
import { IEventType, IObjectEvent, IObjectTalk } from "../../types/CreatorTypes"
import { genStringId, toText } from "../../lib/gen"
import { NewObject } from "./NewObject"
import { iform } from "./TemplateForm"
import { EventChooser } from "./EventChooser"
import { NewEvent } from "./NewEvent"
import { work } from "../../data/work"
import { db } from "../../data/db"
import { EditorPrompted } from "../Parts/Sys/EditorPrompted"
import { getHero } from "../../data/systemObjects"
import { objectList } from "../../data/objectList"

export type CutsceneType = "cutscene" | "talk" | "drops" | "bulk" | "startend"

export type ICutsceneToReturn = {
  oldKey?: string
  key?: string
  cutscene?: IObjectTalk[]
}

export interface INewCutsceneConfig {
  editor: Editor
  type: CutsceneType
  object?: NewObject
  x?: number
  y?: number
  events?: IObjectTalk[]
}

export interface IFieldCutsceneConfig {
  numField: number
  objCutscene: NewCutscene
  cutscene: IObjectTalk
}

export class EventCard {
  private el!: HTMLDivElement

  id: string

  private type: string

  private labelText!: string

  private evt: IObjectEvent

  private fieldCutscene: FieldCutscene

  private eventMeta: IEventType

  constructor(evt: IObjectEvent, fieldCutscene: FieldCutscene) {
    this.id = evt.n
    this.type = evt.type
    this.evt = evt
    this.fieldCutscene = fieldCutscene

    this.eventMeta = EVENT_LIST.find((k) => k.id === evt.type) as IEventType
  }
  private createElement(): void {
    this.el = kel("div", "btn-evt")
    this.el.innerHTML = `
    <div class="evt-name">${this.eventMeta.name}</div>
    <div class="btn btn-delete"><i class="fa-solid fa-trash-can"></i></div>`
  }

  updateData(evt: IObjectEvent): void {
    this.evt = evt
    this.writeData()
  }

  private writeData(): void {
    const nameField = futor(".evt-name", this.el)

    const name = this.eventMeta.name
    const contents: string[] = []

    if (this.evt.who) {
      const whoObj = this.evt.who === "hero" ? getHero() : objectList.find(this.evt.who)?.object
      const whoName = whoObj?.name || "[Object Not Found]"
      contents.push(whoName)
    }

    if (this.evt.map) {
      const mapName = work[this.evt.map]?.name || "[Map Not Found]"
      contents.push(mapName)
    }

    if (this.evt.x) contents.push(`${this.evt.x}x`)

    if (this.evt.y) contents.push(`${this.evt.y}y`)

    if (this.evt.direction) contents.push(this.evt.direction)

    if (this.evt.time) contents.push(`${this.evt.time}ms`)

    if (this.evt.walk) {
      this.evt.walk.forEach((k) => {
        const whoObj = this.evt.who === "hero" ? getHero() : objectList.find(k.who || "undefined")?.object
        const whoName = whoObj?.name || "[Object Not Found]"
        contents.push(`${whoName}: ${k.direction || "down"}`)
      })
    }

    if (this.evt.name && this.evt.type === "addNote") {
      contents.push(this.evt.name.en)
    }

    if (this.evt.text && this.evt.type !== "addStates") {
      contents.push(this.evt.text.en)
    }

    if (this.evt.pages && this.evt.pages.length >= 1) {
      contents.push(this.evt.pages[0].en)
    }

    if (this.evt.states) {
      contents.push(this.evt.states.join(", "))
    }

    if (this.evt.id && this.evt.type === "addItem") {
      const itemName = db.items.find((k) => k.id === this.evt.id)?.name.en || "[Item Not Found]"
      contents.push(itemName)
    }

    if (this.evt.amount) {
      contents.push(this.evt.amount.toString())
    }

    if (this.evt.action) {
      contents.push(this.evt.action)
    }

    if (this.evt.which) {
      const audioName = db.assets.find((k) => k.id === this.evt.src)?.name || "[Audio Not Found]"
      contents.push(audioName, this.evt.which)
    }

    const content = contents.join(", ")

    nameField.innerHTML = `${name} <small>${toText(content)}</small>`
  }

  get html(): HTMLDivElement {
    return this.el
  }

  private onClick(): void {
    const btnDelete = futor(".btn-delete", this.el)
    this.el.onclick = (e) => {
      if (e.target instanceof Node && btnDelete.contains(e.target)) {
        this.fieldCutscene.onEventDelete(this.id)
        return
      }
      this.fieldCutscene.onEventClick(this.id)
    }
  }

  destroy(): void {
    this.el.remove()
  }

  init(): this {
    this.createElement()
    this.writeData()
    this.onClick()
    return this
  }
}

export class FieldCutscene {
  private el!: HTMLDivElement

  private numField: number
  id: string

  private labelText!: string

  objCutscene: NewCutscene
  cutscene: IObjectTalk

  list: EventCard[] = []

  constructor(config: IFieldCutsceneConfig) {
    this.id = config.numField < 1 ? "default" : genStringId()
    this.numField = config.numField
    this.objCutscene = config.objCutscene
    this.cutscene = config.cutscene
  }
  private createElement(): void {
    this.el = kel("div", "f")
    this.el.innerHTML = `
    <div class="i">
      <div class="inp">
        <div class="evt-drop">
          <p class="obj-flag-${this.id}">${this.labelText}</p>
          <span class="btn btn-drop drop-${this.id}"><i class="fa-duotone fa-solid fa-circle-xmark"></i></span>
        </div>
        <input class="evt-state" type="text" name="obj-flag-${this.id}" id="obj-flag-${this.id}" placeholder="EXIT_DISGUISE" autocomplete="off" required />
      </div>

      <div class="inp evt-list"></div>

      <div class="btn btn-add-evt"><i class="fa-solid fa-plus"></i> Add Event</div>
    </div>`
  }

  private removeOnDefault(): void {
    const btnDrop = futor(`.drop-${this.id}`, this.el)
    const inpFlag = futor(`#obj-flag-${this.id}`, this.el)
    if (this.numField < 1 || this.objCutscene.type === "startend") {
      btnDrop.remove()
      inpFlag.remove()
      return
    }

    btnDrop.onclick = async () => {
      if (this.objCutscene.locked) return
      this.objCutscene.lock()

      const confDelete = await modal.confirm("Delete this group states event?")

      if (!confDelete) {
        this.objCutscene.lock(false)
        return
      }

      this.objCutscene.removeField(this.id)
      this.objCutscene.lock(false)
      this.destroy()
    }
  }

  updateNum(numField: number): void {
    this.numField = numField
    if (this.objCutscene.type === "startend") {
      if (this.numField < 1) {
        this.labelText = "Ending Events <small>Fire once the mission is ending</small>"
      } else {
        this.labelText = "Starting Events <small>Fire once the mission is starting</small>"
      }
    } else if (this.numField < 1) {
      this.labelText = "Default Events <small>Fire if no current states meet any of the flags</small>"
    } else if (this.numField === 1) {
      this.labelText = "Fire if the current states meet these flags"
    } else {
      this.labelText = "Fire if the current states do not meet the previous flags but meet these flags"
    }
    const label = futor(".evt-drop p", this.el) as HTMLLabelElement
    if (numField === 0) label.removeAttribute("for")
    label.innerHTML = this.labelText
  }

  private writeData(): void {
    const states = this.cutscene?.required || []
    const stateText = states.join(", ")

    if (this.numField !== 0 && this.objCutscene.type !== "startend") {
      const inpStates = futor(`#obj-flag-${this.id}`, this.el) as HTMLInputElement
      inpStates.value = stateText
    }

    this.cutscene?.events?.forEach((k) => this.addEvent(k))
  }

  get getCutscenes(): IObjectTalk {
    const inpFlag = futor(`#obj-flag-${this.id}`, this.el) as HTMLInputElement
    if (inpFlag) {
      this.cutscene.required = inpFlag.value
        .split(",")
        .filter((k) => k.trim().length >= 1)
        .map((k) => k.trim())
    }

    return this.cutscene
  }

  private addEvent(k: IObjectEvent): void {
    const field = futor(".evt-list", this.el)
    const card = new EventCard(k, this).init()
    field.append(card.html)
    this.list.push(card)
  }

  private addNewListener(): void {
    const btnAdd = futor(".btn-add-evt", this.el)
    btnAdd.onclick = () => {
      if (this.objCutscene.locked) return
      this.objCutscene.lock()

      const eventChooser = new EventChooser(this.objCutscene.editor, this.cutscene?.events || [])

      eventChooser.onDone((s?: IObjectEvent) => {
        this.objCutscene.hide(false)
        this.parseEvent(s)
      })

      this.objCutscene.hide()
      eventChooser.init()
    }
  }

  async onEventClick(evId: string): Promise<void> {
    if (this.objCutscene.locked) return

    const event = this.cutscene.events.find((k) => k.n === evId)
    if (!event) return

    const eventFormType = EVENT_LIST.find((k) => k.id === event.type)
    if (!eventFormType) return

    this.objCutscene.lock()

    if (eventFormType.disabled) {
      await modal.alert("This built-in event can't be modified")
      this.objCutscene.lock(false)
      return
    }

    const evtForm = new NewEvent(this.objCutscene.editor, eventFormType, event, this.cutscene.events)
    evtForm.onDone((s?: IObjectEvent) => {
      this.objCutscene.hide(false)
      this.parseEvent(s)
    })

    this.objCutscene.hide()
    evtForm.init()
  }

  async onEventDelete(evId: string): Promise<void> {
    if (this.objCutscene.locked) return

    const event = this.cutscene.events.find((k) => k.n === evId)
    if (!event) return

    const eventFormType = EVENT_LIST.find((k) => k.id === event.type)
    if (!eventFormType) return

    this.objCutscene.lock()

    if (eventFormType.disabled) {
      await modal.alert("This built-in event can't be modified")
      this.objCutscene.lock(false)
      return
    }

    const eventIndex = this.cutscene.events.findIndex((k) => k.n === evId)
    if (eventIndex === -1) {
      this.objCutscene.lock(false)
      return
    }

    const evtCard = this.list.find((k) => k.id === evId)
    evtCard?.destroy()

    this.cutscene.events.splice(eventIndex, 1)

    this.objCutscene.lock(false)
  }

  private parseEvent(addedEvt?: IObjectEvent): void {
    this.objCutscene.lock(false)

    if (!addedEvt) return

    if (!this.cutscene) this.cutscene = { events: [] }

    const eventIndex = this.cutscene.events.findIndex((k) => k.n === addedEvt.n)
    if (eventIndex !== -1) {
      this.cutscene.events[eventIndex] = addedEvt

      const evtCard = this.list.find((k) => k.id === addedEvt.n)
      evtCard?.updateData(addedEvt)

      return
    }

    this.cutscene.events.push(addedEvt)
    this.addEvent(addedEvt)
  }

  get html(): HTMLDivElement {
    return this.el
  }

  destroy(): void {
    this.el.remove()
  }

  init(): this {
    this.createElement()
    this.removeOnDefault()
    this.updateNum(this.numField)
    this.writeData()
    this.addNewListener()
    return this
  }
}

export class NewCutscene {
  locked: boolean = false
  private el!: HTMLFormElement
  editor: Editor
  type: CutsceneType

  private object?: NewObject
  private x?: number
  private y?: number

  list: FieldCutscene[] = []

  private oldId?: string
  id?: string

  private titleText: string

  gameEvents: IObjectTalk[]

  protected onSubmission?: (s?: ICutsceneToReturn, isCanceled?: boolean, isDeleted?: boolean) => IAny

  constructor(config: INewCutsceneConfig) {
    this.editor = config.editor
    this.type = config.type
    this.object = config.object
    this.x = config.x
    this.y = config.y
    this.gameEvents = config.events || []

    if (config.type === "cutscene") {
      const comId = `${config.x},${config.y}`
      this.oldId = comId
      this.id = comId
    }

    if (config.type === "talk") {
      this.titleText = "Interaction - Cutscene"
    } else if (config.type === "drops") {
      this.titleText = "Enemy On Defeat - Cutscene"
    } else if (config.type === "bulk") {
      this.titleText = "Multiple Cutscene Spaces"
    } else if (config.type === "startend") {
      this.titleText = "Starting/Ending - Cutscene"
    } else {
      if (config.events && config.events.length >= 1) {
        this.titleText = "Update Cutscene Space"
      } else {
        this.titleText = "New Cutscene Space"
      }
    }

    const waitGameEvt = this.gameEvents
    waitGameEvt.forEach((key, idx) => key.events.forEach((k, i) => (this.gameEvents[idx].events[i].n = genStringId() + i)))
  }
  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">${this.titleText}</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f field-cutscene-coor">
        <div class="group">
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="obj-evt-x">*X</label>
                <input type="number" name="obj-evt-x" id="obj-evt-x" placeholder="x (on grid)" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="obj-evt-y">*Y</label>
                <input type="number" name="obj-evt-y" id="obj-evt-y" placeholder="y (on grid)" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="btn btn-find find-coor">Select from tile</div>
            </div>
          </div>
        </div>
      </div>
      <div class="groups group-states"></div>
      <div class="groups group-default"></div>
      <div class="f field-add-new">
        <div class="i">
          <div class="btn btn-add-field"><i class="fa-solid fa-plus"></i> Add Has Flag</div>
        </div>
      </div>
      <div class="f">
        <div class="s field-delete">
          <div class="btn btn-delete-object">Delete</div>
        </div>
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>
    `)
  }

  private checkDeletion(): void {
    const fieldCoor = futor(".field-cutscene-coor", this.el)
    const fieldDelete = futor(".field-delete", this.el)

    if (this.type === "cutscene") {
      this.writeCoor()
      this.findCoor()
      if (this.gameEvents.length >= 1) {
        this.deleteListener()
      } else {
        fieldDelete.remove()
      }
    } else {
      fieldCoor.remove()
      fieldDelete.remove()
    }
  }

  private writeCoor(): void {
    const inpX = futor("#obj-evt-x", this.el) as HTMLInputElement
    inpX.value = this.x?.toString() || "0"

    const inpY = futor("#obj-evt-y", this.el) as HTMLInputElement
    inpY.value = this.y?.toString() || "0"
  }
  private findCoor(): void {
    const btnCoor = futor(".find-coor", this.el)

    btnCoor.onclick = () => {
      if (this.locked) return
      this.locked = true

      this.hide()

      const editorPrompt = new EditorPrompted(this.editor, "Select 1 tile on current map")
      editorPrompt.start()

      this.editor.findTile((x, y) => {
        this.hide(false)
        editorPrompt.end()
        this.locked = false
        if (typeof x === "number" && typeof y === "number") this.coorFound(x, y)
      })
    }
  }
  private coorFound(x: number, y: number): void {
    this.locked = false
    this.x = x
    this.y = y
    this.id = `${x},${y}`
    this.writeCoor()
  }
  private addHasFlagListener(): void {
    const fieldAdd = futor(".field-add-new", this.el)
    if (this.type === "startend") {
      fieldAdd.remove()
    } else {
      const btnAdd = futor(".btn-add-field", this.el)

      btnAdd.onclick = () => {
        if (this.locked) return
        this.writeHasState({ events: [] })
      }
    }

    this.gameEvents
      .filter((_, i) => i !== this.gameEvents.length - 1)
      .forEach((k) => {
        this.writeHasState(k)
      })
  }
  private writeDefault(): void {
    const field = futor(".group-default", this.el)
    const fieldCutscene = new FieldCutscene({
      numField: this.list.length,
      objCutscene: this,
      cutscene: this.gameEvents[this.gameEvents.length - 1]
    }).init()

    field.append(fieldCutscene.html)

    this.list.push(fieldCutscene)
  }

  private writeHasState(cutscene: IObjectTalk): void {
    const field = futor(".group-states", this.el)
    const fieldCutscene = new FieldCutscene({
      numField: this.list.length,
      objCutscene: this,
      cutscene
    }).init()

    field.append(fieldCutscene.html)

    this.list.push(fieldCutscene)
  }

  removeField(fieldId: string): void {
    const fieldIdx = this.list.findIndex((field) => field.id === fieldId)

    if (fieldIdx === -1) return

    this.list.splice(fieldIdx, 1)

    this.list.forEach((field, i) => {
      if (i === 0) return
      field.updateNum(i)
    })
  }

  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()

      if (this.locked) return
      this.lock(true)

      const missedRequires: string[] = []

      const cutscenes = this.list
        .filter((k) => k.id !== "default" && k.getCutscenes.events.length >= 1)
        .map((k) => {
          if (this.type !== "startend" && (k.getCutscenes?.required?.length || 0) < 1) {
            missedRequires.push(k.id)
          }
          return k.getCutscenes
        })

      const defaultCutscene = this.list.find((k) => k.id === "default" && k.getCutscenes?.events?.length >= 1)?.getCutscenes

      if (defaultCutscene) cutscenes.push(defaultCutscene)

      if (missedRequires.length >= 1) {
        await modal.alert(`You have ${missedRequires.length} required field(s) waiting to be filled out.`)
        this.lock(false)
        return
      }

      this.lock(false)

      const data: ICutsceneToReturn = {
        oldKey: this.oldId,
        key: this.id,
        cutscene: cutscenes
      }

      if (cutscenes.length < 1) return this.destroy(data, false, true)

      this.destroy(data)
    }
  }

  private deleteListener(): void {
    const btnDelete = futor(".btn-delete-object", this.el)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const confDelete = await modal.confirm(`Are you sure want to delete this cutscene space at tile <b>${this.x}x ${this.y}y?</b>`)

      if (!confDelete) {
        this.locked = false
        return
      }

      this.locked = false

      this.destroy({ oldKey: this.oldId }, false, true)
    }
  }

  onDone(newFunc: (s?: ICutsceneToReturn, isCanceled?: boolean, isDeleted?: boolean) => void): void {
    this.onSubmission = newFunc
  }

  hide(newStatus: boolean = true): void {
    if (newStatus) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  private closeListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy(undefined, true)
    }
  }

  lock(status: boolean = true): void {
    if (status) {
      this.locked = true
      return
    }
    this.locked = false
  }

  destroy(data?: ICutsceneToReturn, isCanceled?: boolean, isDeleted?: boolean): void {
    if (this.locked) return

    this.el.remove()

    if (this.onSubmission) {
      this.onSubmission(data, isCanceled, isDeleted)
      this.onSubmission = undefined
    }
  }
  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.checkDeletion()
    this.writeDefault()
    this.addHasFlagListener()
    this.closeListener()
    this.submitListener()

    return this
  }
}
