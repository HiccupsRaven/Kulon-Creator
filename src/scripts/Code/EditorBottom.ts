import { kel } from "../lib/kel"
import { Editor } from "./Editor"

interface IEditorBottomConfig {
  editor: Editor
}

export class EditorBottom {
  locked: boolean = false

  private el!: HTMLDivElement

  editor: Editor

  constructor(config: IEditorBottomConfig) {
    this.editor = config.editor

    this.createElement()
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-bottom")
    this.el.innerHTML = `
    <div class="kulon-code-bottom-left">
      <div class="code-lang"><i class="fa-light fa-brackets-curly fa-fw"></i> TypeScript</div>
      <div class="code-pos">Ln 10, Col 40 (20 selected)</div>
    </div>
    <div class="kulon-code-bottom-right">
      <div class="btn code-compile">
        <div class="code-text"><i class="fa-solid fa-check"></i></div>
        <div class="code-text">Compile:</div>
        <div class="code-file">CustomGame.ts</div>
      </div>
    </div>`
  }

  private writeData(): void {}

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
