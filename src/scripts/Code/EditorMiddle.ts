import { kel } from "../lib/kel"
import { Editor } from "./Editor"
import { Dashboard } from "./Middle/Dashboard"
import { SysManager } from "./Middle/SysManager"
import { Tabs } from "./Middle/Tabs"
import { TextEditor } from "./Middle/TextEditor"

interface IEditorMiddleConfig {
  editor: Editor
}

export class EditorMiddle {
  locked: boolean = false

  private el!: HTMLDivElement

  editor: Editor

  dashboard?: Dashboard
  tabs?: Tabs
  textEditor?: TextEditor

  midleft!: HTMLDivElement
  sysManager!: SysManager

  constructor(config: IEditorMiddleConfig) {
    this.editor = config.editor

    this.createElement()
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-mid")
  }

  private writeData(): void {
    this.midleft = kel("div", "kulon-code-mid-left")

    this.startDashboard()

    const sysManager = new SysManager({ middle: this })
    sysManager.init()

    this.sysManager = sysManager

    this.el.append(this.midleft, this.sysManager.html)
  }

  startDashboard(): void {
    this.dashboard = new Dashboard({ middle: this })

    this.dashboard.init()

    this.midleft.append(this.dashboard.html)
  }

  endDashboard(): void {
    if (this.dashboard?.destroy) this.dashboard.destroy()
    this.dashboard = undefined
  }

  startTextEditor(): void {
    this.tabs = new Tabs({ middle: this })
    this.textEditor = new TextEditor({ middle: this })

    this.tabs.init()
    this.textEditor.init()

    this.sysManager.start()

    this.midleft.append(this.tabs.html, this.textEditor.html)
  }

  endTextEditor(): void {
    if (this.tabs?.destroy) this.tabs.destroy()
    if (this.textEditor?.destroy) this.textEditor.destroy()
    this.tabs = undefined
    this.textEditor = undefined
  }

  lock(status: boolean = true): void {
    this.locked = status
  }

  get html(): HTMLDivElement {
    return this.el
  }

  init(): this {
    this.writeData()
    return this
  }
}
