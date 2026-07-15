import { kel } from "../../lib/kel"
import { Tabs } from "./Tabs"

export interface ITabButtonData {
  name: string
  ic: string
  ext: string
}

export interface ITabButtonConfig extends ITabButtonData {
  tabs: Tabs
}

export class TabButton {
  name: string

  private ic: string

  private ext: string

  private tabs: Tabs

  private el!: HTMLDivElement

  private eFile!: HTMLDivElement

  private eStatus!: HTMLDivElement

  private isChanged: boolean = false

  constructor(config: ITabButtonConfig) {
    this.name = config.name

    this.ic = config.ic

    this.ext = config.ext

    this.tabs = config.tabs

    this.createElement()
  }

  private createElement(): void {
    this.el = kel("div", "btn kulon-code-tab")
  }

  private renderFile(): void {
    this.eFile = kel("div", "file")

    this.el.append(this.eFile)
  }

  private renderStatus(): void {
    this.eStatus = kel("div", "status")
    this.eStatus.title = `Save ${this.name}.${this.ext}`

    this.eStatus.innerHTML = `<i class="fa-solid fa-floppy-disk"></i>`

    this.el.append(this.eStatus)
  }

  activate(status: boolean = true): void {
    this.el.classList[status ? "add" : "remove"]("active")
  }

  updateFile(config: ITabButtonData): void {
    this.name = config.name

    this.ic = config.ic

    this.ext = config.ext

    const readOnly = config.name === "assets" ? " (read-only)" : ""

    this.eFile.innerHTML = `<i class="fa-${this.ic} fa-fw"></i> ${this.name}.${this.ext}${readOnly}`
  }

  updateStatus(status: boolean) {
    if (this.isChanged === status) return

    this.isChanged = status

    this.el.classList[status ? "add" : "remove"]("unsaved")
  }

  private onClick(): void {
    this.el.onclick = (e) => {
      this.tabs.onTabSwitch(this.name)

      if (e.target instanceof Node && this.eStatus.contains(e.target) && this.isChanged) {
        this.tabs.onTabSave(this.name)
      }
    }
  }

  get isDirty(): boolean {
    return this.isChanged
  }

  get html(): HTMLDivElement {
    return this.el
  }

  init(): void {
    this.renderFile()

    this.renderStatus()

    this.updateFile({ name: this.name, ic: this.ic, ext: this.ext })

    this.updateStatus(this.isChanged)

    this.onClick()
  }
}
