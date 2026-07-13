import { idb } from "../lib/idb"
import { futor, kel } from "../lib/kel"
import modal from "../lib/modal"
import { CodeBuild } from "./Bottom/CodeBuild"
import { CodeErrors } from "./data/CodeErrors"
import { db } from "./data/db"
import { modLangExtensions } from "./data/EditorModel"
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
  json: "JSON"
}

export class EditorBottom {
  locked: boolean = false

  private el!: HTMLDivElement

  editor: Editor

  private codeBuild: CodeBuild

  private ePosition!: HTMLSpanElement
  private eSelection!: HTMLSpanElement
  private eLanguage!: HTMLSpanElement

  constructor(config: IEditorBottomConfig) {
    this.editor = config.editor

    this.codeBuild = new CodeBuild()

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
      <div class="btn code-compile" title="Compile Mod: No Project">
        <div class="code-text">No Project <i class="fa-solid fa-dot fa-fw"></i></div>
      </div>
    </div>`

    this.ePosition = futor(".code-pos-val", this.el, "span")

    this.eSelection = futor(".code-sel-val", this.el, "span")

    this.eLanguage = futor(".code-lang-val", this.el, "span")
  }

  private writeData(): void {}

  private btnCompileListener(): void {
    const btnCompile = futor(".code-compile", this.el)

    btnCompile.onclick = async () => {
      if (this.editor.locked) return
      if ((db.modLanguage.lastCompiled || 0) >= db.modified) return
      if (this.editor.middle.textEditor?.isSwitchLocked) return
      this.lock()

      const dirtySize = this.editor.middle.tabs?.dirtySize || 0

      if (dirtySize >= 1) {
        await modal.alert(`Error: ${dirtySize} unsaved file`)
        this.lock(false)
        return
      }

      const errorMarkers = this.editor.middle.textEditor?.errorList || []

      if (errorMarkers.length >= 1) {
        await new Promise((resolve) => new CodeErrors(errorMarkers, resolve))
        this.lock(false)
        return
      }

      btnCompile.innerHTML = `<div class="code-text">Compiling</div><div class="code-text"><i class="fa-solid fa-circle-notch fa-spin fa-fw"></i></div>`
      btnCompile.title = "Compiling Mod"

      const scriptString = db.script
      const styleString = db.style

      const scriptLoader = modLangExtensions[db.modLanguage.script]
      const styleLoader = modLangExtensions[db.modLanguage.style]

      await this.codeBuild.buildCode({
        script: scriptString,
        style: styleString,
        scriptLoader,
        styleLoader
      })

      this.checkCompiled(db.modified)

      this.lock(false)
    }
  }

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
    const modLang = db.modLanguage

    await idb.saveMod(db.id, { script: db.script, style: db.style }, modLang)
  }

  checkCompiled(ts: number): void {
    const btnCompile = futor(".code-compile", this.el)

    if ((db.modLanguage.lastCompiled || 0) >= ts) {
      btnCompile.title = "Mod Compiled"
      btnCompile.innerHTML = `<div class="code-text"><i class="fa-solid fa-check"></i></div>`
    } else {
      btnCompile.title = "Compile Project's Mod"
      btnCompile.innerHTML = `<div class="code-text">Compile Mod</div><div class="code-text"><i class="fa-solid fa-dot"></i></div>`
    }
  }

  lock(status: boolean = true): void {
    this.locked = status
  }

  get html(): HTMLDivElement {
    return this.el
  }

  init(): this {
    this.writeData()
    this.btnCompileListener()
    return this
  }
}
