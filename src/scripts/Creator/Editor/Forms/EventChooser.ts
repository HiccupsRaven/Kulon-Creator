import { eroot, futor, kel } from "../../../lib/kel"
import { IAny } from "../../../types/LibTypes"
import EVENT_LIST from "../../data/eventList"
import { Editor } from "../../Editor"
import { IEventType, IObjectEvent } from "../../types/CreatorTypes"
import { NewEvent } from "./NewEvent"
import { windowed } from "./Windowed"

class ChooserCard {
  private el!: HTMLDivElement

  private chooser: EventChooser

  readonly itm: IEventType
  readonly id: IEventType["id"]
  readonly name: IEventType["name"]
  readonly desc: IEventType["desc"]
  readonly ic: IEventType["ic"]
  constructor(itm: IEventType, eventChooser: EventChooser) {
    this.chooser = eventChooser
    this.itm = itm
    this.id = itm.id
    this.name = itm.name
    this.desc = itm.desc
    this.ic = itm.ic
  }
  createElement(): void {
    this.el = kel("div", "card")
    this.el.innerHTML = `
    <div class="ic">
      <i class="fa-light fa-${this.ic} fa-fw"></i>
    </div>
    <div class="text">
      <p class="text-name">${this.name}</p>
      <p class="text-sub">${this.desc}</p>
    </div>`
  }
  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  private onClick(): void {
    this.el.onclick = () => this.chooser.onEventChosen(this.itm)
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

export class EventChooser {
  locked: boolean = false
  private el!: HTMLDivElement
  private parent!: HTMLDivElement

  list: ChooserCard[] = []

  private onSubmission?: (s?: IObjectEvent) => IAny

  constructor(
    public editor: Editor,
    public itms?: IObjectEvent[]
  ) {}
  createElement(): void {
    this.el = kel("div", "event-chooser")
    this.el.innerHTML = `
    <div class="chooser-title">Choose Event</div>
    <div class="chooser-list">
      <div class="card-search">
        <input type="text" name="event-search" id="event-search" placeholder="Search Event" />
      </div>
    </div>
    <div class="chooser-actions">
      <div class="btn btn-cancel"><i class="fa-regular fa-arrow-left"></i> Cancel</div>
    </div>`
  }
  private writeData(): void {
    const field = futor(".chooser-list", this.el)

    EVENT_LIST.filter((evt) => !evt.disabled).forEach((evt) => {
      const card = new ChooserCard(evt, this).init()
      field.append(card.html)
      this.list.push(card)
    })
  }
  private searchListener(): void {
    const inp = futor("#event-search", this.el) as HTMLInputElement

    inp.oninput = () => {
      const val = inp.value

      this.list.forEach((evt) => {
        evt.hide(!evt.name.toLowerCase().includes(val.trim().toLowerCase()))
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
  onEventChosen(evt: IEventType): void {
    this.destroy()

    const evtForm = new NewEvent(this.editor, evt, undefined, this.itms)
    if (this.onSubmission) {
      evtForm.onDone(this.onSubmission)
    }
    evtForm.init()
  }
  onDone(newFunc: (s?: IObjectEvent) => void): void {
    this.onSubmission = newFunc
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(): void {
    this.list.splice(0, this.list.length)
    this.parent.remove()
  }
  init(): this {
    this.createElement()
    this.parent = windowed(this.el)
    eroot().append(this.parent)
    this.writeData()
    this.searchListener()
    this.cancelListener()
    return this
  }
}
