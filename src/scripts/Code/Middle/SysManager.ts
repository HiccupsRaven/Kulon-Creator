import { futor, kel, qutor } from "../../lib/kel"
import { db } from "../data/db"
import { EditorMiddle } from "../EditorMiddle"
import { IModLanguage, ModLanguage, ModScriptLanguage, ModStyleLanguage, UGMRef } from "../types/CodeTypes"
import { GenerateModValues } from "./GenerateModValues"

interface ISysManagerConfig {
  middle: EditorMiddle
}

export class SysManager {
  locked: boolean = false

  private el!: HTMLDivElement

  middle: EditorMiddle

  constructor(config: ISysManagerConfig) {
    this.middle = config.middle
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-mid-right")
    this.el.innerHTML = `
    <div class="lang-mode script-lang">
      <div class="tx">Script Language:</div>
      <div class="inp">
        <div class="radio">
          <label for="script-lang-typescript">
            <input type="radio" name="script-lang" id="script-lang-typescript" value="typescript" />
            <span><i class="fa-brands fa-typescript fa-fw"></i> TypeScript</span>
          </label>
        </div>
        <div class="radio">
          <label for="script-lang-javascript">
            <input type="radio" name="script-lang" id="script-lang-javascript" value="javascript" />
            <span><i class="fa-brands fa-js fa-fw"></i> JavaScript</span>
          </label>
        </div>
      </div>
    </div>
    <div class="lang-mode style-lang">
      <div class="tx">Style Language:</div>
      <div class="inp">
        <div class="radio">
          <label for="style-lang-scss">
            <input type="radio" name="style-lang" id="style-lang-scss" value="scss" />
            <span><i class="fa-brands fa-sass fa-fw"></i> SCSS</span>
          </label>
        </div>
        <div class="radio">
          <label for="style-lang-css">
            <input type="radio" name="style-lang" id="style-lang-css" value="css" />
            <span><i class="fa-brands fa-css3 fa-fw"></i> CSS</span>
          </label>
        </div>
      </div>
    </div>
    <div class="lang-mode">
      <div class="btn btn-reset-files"><i class="fa-solid fa-triangle-exclamation"></i> RESET FILES</div>
    </div>`
  }

  private writeData(langScript?: ModScriptLanguage, langStyle?: ModStyleLanguage): void {
    const scriptLang = langScript ?? db.modLanguage.script
    const styleLang = langStyle ?? db.modLanguage.style

    const scriptChecked = qutor('[name="script-lang"]:checked', this.el, "input")
    if (scriptChecked) scriptChecked.checked = false

    const styleChecked = qutor('[name="script-lang"]:checked', this.el, "input")
    if (styleChecked) styleChecked.checked = false

    const radioScript = qutor(`#script-lang-${scriptLang}`, this.el, "input")
    if (radioScript) radioScript.checked = true

    const radioStyle = qutor(`#style-lang-${styleLang}`, this.el, "input")
    if (radioStyle) radioStyle.checked = true
  }

  private scriptInputListener(): void {
    const eScripts = this.el.querySelectorAll('[name="script-lang"]') as NodeListOf<HTMLInputElement>

    eScripts.forEach((inp) => {
      inp.onchange = () => this.switchLanguage("customScript", inp.value as ModScriptLanguage)
    })
  }
  private styleInputListener(): void {
    const eStyles = this.el.querySelectorAll('[name="style-lang"]') as NodeListOf<HTMLInputElement>

    eStyles.forEach((inp) => {
      inp.onchange = () => this.switchLanguage("customStyle", inp.value as ModStyleLanguage)
    })
  }

  private switchLanguage(tabName: string, modLang: ModLanguage): void {
    this.middle.textEditor?.switchFileLang(tabName, modLang)
  }

  private btnResetListener(): void {
    const btnReset = futor(".btn-reset-files", this.el)

    btnReset.onclick = () => {
      if (this.middle.editor.locked) return
      this.middle.lock()

      const genModValues = new GenerateModValues(db.modLanguage)
      genModValues.onDone((modLang, newModVal) => {
        if (!modLang || !newModVal) {
          this.middle.lock(false)
          return
        }

        this.onFilesReset(modLang, newModVal)
      })
      genModValues.init()
    }
  }

  private onFilesReset(modLang: IModLanguage, modVal: UGMRef): void {
    this.middle.lock(false)

    this.middle.textEditor?.resetFiles(modLang, modVal)
  }

  get html(): HTMLDivElement {
    return this.el
  }

  start(): void {
    this.writeData()
    this.scriptInputListener()
    this.styleInputListener()
    this.btnResetListener()
  }

  restart(langScript?: ModScriptLanguage, langStyle?: ModStyleLanguage): void {
    this.writeData(langScript, langStyle)
  }

  init(): this {
    this.createElement()
    return this
  }
}
