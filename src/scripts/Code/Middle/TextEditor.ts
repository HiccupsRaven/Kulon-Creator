import { futor, kel } from "../../lib/kel"
import { db } from "../data/db"
import { addExternalLib, initEditor } from "../data/editorWork"
import { EditorMiddle } from "../EditorMiddle"

interface ITextEditorConfig {
  middle: EditorMiddle
}

export class TextEditor {
  locked: boolean = false

  private el!: HTMLDivElement

  middle: EditorMiddle

  codeEditor!: HTMLDivElement

  constructor(config: ITextEditorConfig) {
    this.middle = config.middle
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-editor")
    this.el.innerHTML = `<div class="code-editor" id="code-editor"></div>`

    this.codeEditor = futor("#code-editor", this.el, "div")
  }

  private writeData(): void {
    this.createExternalLib()
    this.createEditor()
  }

  private createExternalLib(): void {
    addExternalLib()
  }

  private createEditor(): void {
    initEditor(this.codeEditor, db.modLanguage.script, db.script)
  }

  get html(): HTMLDivElement {
    return this.el
  }

  destroy(): void {
    this.el.remove()
  }

  init(): this {
    this.createElement()
    this.writeData()
    return this
  }
}
