import { eroot, futor, kel } from "../../../../lib/kel"
import { Editor } from "../../../Editor"

export class EditorPrompted {
  private el!: HTMLDivElement

  constructor(
    private editor: Editor,
    private text: string
  ) {}
  createElement(): void {
    this.el = kel("div", "prompted")
    this.el.innerHTML = `<div class="text">${this.text}</div><div class="btn btn-abort"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>`
  }
  private abortListener(): void {
    const btnAbort = futor(".btn-abort", this.el)
    btnAbort.onclick = () => {
      this.editor.cancelFindTile()
      this.end()
    }
  }

  end(): void {
    this.el.remove()
  }

  start(): this {
    this.createElement()
    eroot().append(this.el)
    this.abortListener()
    return this
  }
}
