import { kel } from "../../lib/kel"
import { Editor } from "../Editor"
import { EditorCanvas } from "./Parts/EditorCanvas"
import { EditorConf } from "./Parts/EditorConf"
import { EditorSys } from "./Parts/EditorSys"

interface EditorMiddleConfig {
  editor: Editor
}

export class EditorMiddle {
  locked: boolean = false
  private el!: HTMLDivElement
  editor: Editor

  sys!: EditorSys
  conf!: EditorConf
  canvas!: EditorCanvas

  constructor(s: EditorMiddleConfig) {
    this.editor = s.editor
  }
  private createElement(): void {
    this.el = kel("div", "EditorMid")

    this.sys = new EditorSys({ middle: this }).init()
    this.conf = new EditorConf({ middle: this }).init()
    this.canvas = new EditorCanvas({ middle: this }).init()

    this.el.append(this.sys.html, this.canvas.html, this.conf.html)
  }
  lock(status: boolean = true): void {
    this.locked = status
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    return this
  }
}
