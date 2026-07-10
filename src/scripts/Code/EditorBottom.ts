import { idb } from "../lib/idb"
import { futor, kel } from "../lib/kel"
import { db } from "./data/db"
import { Editor } from "./Editor"
import { ModLanguage } from "./types/CodeTypes"

interface IEditorBottomConfig {
  editor: Editor
}

type ILangNames = Record<ModLanguage, string>

const langNames: ILangNames = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  scss: "SCSS",
  css: "CSS",
  less: "Less",
  json: "JSON"
}

export class EditorBottom {
  locked: boolean = false

  private el!: HTMLDivElement

  editor: Editor

  private ePosition!: HTMLSpanElement
  private eSelection!: HTMLSpanElement
  private eLanguage!: HTMLSpanElement

  constructor(config: IEditorBottomConfig) {
    this.editor = config.editor

    this.createElement()
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-bottom")
    this.el.innerHTML = `
    <div class="kulon-code-bottom-left">
      <div class="code-lang"><i class="fa-light fa-brackets-curly fa-fw"></i> <span class="code-lang-val"></span></div>
      <div class="code-pos"><span class="code-pos-val"></span> <span class="code-sel-val"></span></div>
    </div>
    <div class="kulon-code-bottom-right">
      <div class="btn code-compile">
        <div class="code-text"><i class="fa-solid fa-check"></i></div>
        <div class="code-text">Compile:</div>
        <div class="code-file">CustomGame.ts</div>
      </div>
    </div>`

    this.ePosition = futor(".code-pos-val", this.el, "span")

    this.eSelection = futor(".code-sel-val", this.el, "span")

    this.eLanguage = futor(".code-lang-val", this.el, "span")
  }

  private writeData(): void {}

  updateLanguage(modLang: ModLanguage): void {
    this.eLanguage.innerHTML = langNames[modLang]
  }

  updatePosition(ln: number, col: number): void {
    this.ePosition.innerHTML = `Ln ${ln}, Col ${col}`
  }

  updateSelection(n: number): void {
    this.eSelection.innerHTML = n > 0 ? `(${n} selected)` : ""
  }

  async uploadSave(): Promise<void> {
    const modLang = JSON.stringify(db.modLanguage || {})

    await idb.saveMod(db.id, { script: db.script, style: db.style }, modLang)
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
