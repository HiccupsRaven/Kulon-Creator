import { eroot, kel } from "../lib/kel"
import { EditorBottom } from "./EditorBottom"
import { EditorMiddle } from "./EditorMiddle"
import { EditorTop } from "./EditorTop"

export class Editor {
  private el!: HTMLDivElement

  private isLocked: boolean = false

  top!: EditorTop
  middle!: EditorMiddle
  bottom!: EditorBottom

  get locked(): boolean {
    return this.isLocked || this.top.locked || this.middle.locked || this.bottom.locked
  }

  private createElement(): void {
    this.el = kel("div", "KulonCode")
  }

  private writeAll(): void {
    this.top = new EditorTop({ editor: this })
    this.middle = new EditorMiddle({ editor: this })
    this.bottom = new EditorBottom({ editor: this })

    this.top.init()
    this.middle.init()
    this.bottom.init()

    this.el.append(this.top.html, this.middle.html, this.bottom.html)
  }

  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.writeAll()
    return this
  }
}
