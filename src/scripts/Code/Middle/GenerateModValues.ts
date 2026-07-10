import { iform } from "../../Creator/Editor/Forms/TemplateForm"
import { eroot, futor } from "../../lib/kel"
import modal from "../../lib/modal"
import { editorModel } from "../data/EditorModel"
import { IModLanguage, ModScriptLanguage, ModStyleLanguage, UGMRef } from "../types/CodeTypes"

export class GenerateModValues {
  locked: boolean = false

  private el!: HTMLFormElement

  private onSubmission?: (modLang?: IModLanguage, modValues?: UGMRef) => void

  constructor() {
    this.createElement()
  }

  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">Mod Language</p>
      </div>
      <div class="f">
        <div class="tx center">
          <br />
          <p>Please select the following programming languages to <b>generate new script and style</b> files</p>
          <br />
        </div>
      </div>
      <div class="f">
        <div class="i">
          <label for="formgen-script-lang">Script Language</label>
          <div class="inp">
            <div class="f p">
              <div class="i">
                <div class="radio">
                  <label for="formgen-script-lang-typescript">
                    <input type="radio" name="formgen-script-lang" id="formgen-script-lang-typescript" value="typescript" checked />
                    <span><i class="fa-brands fa-typescript fa-fw"></i> TypeScript <i class="fa-solid fa-thumbs-up"></i></span>
                  </label>
                </div>
              </div>
              <div class="i">
                <div class="radio">
                  <label for="formgen-script-lang-javascript">
                    <input type="radio" name="formgen-script-lang" id="formgen-script-lang-javascript" value="javascript" />
                    <span><i class="fa-brands fa-js fa-fw"></i> JavaScript</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <label for="formgen-style-lang">Style Language</label>
          <div class="inp">
            <div class="f p">
              <div class="i">
                <div class="radio">
                  <label for="formgen-style-lang-scss">
                    <input type="radio" name="formgen-style-lang" id="formgen-style-lang-scss" value="scss" />
                    <span><i class="fa-brands fa-sass fa-fw"></i> SCSS <i class="fa-solid fa-thumbs-up"></i></span>
                  </label>
                </div>
              </div>
              <div class="i">
                <div class="radio">
                  <label for="formgen-style-lang-less">
                    <input type="radio" name="formgen-style-lang" id="formgen-style-lang-less" value="less" />
                    <span><i class="fa-brands fa-less fa-fw"></i> Less</span>
                  </label>
                </div>
              </div>
              <div class="i">
                <div class="radio">
                  <label for="formgen-style-lang-css">
                    <input type="radio" name="formgen-style-lang" id="formgen-style-lang-css" value="css" checked />
                    <span><i class="fa-brands fa-css3 fa-fw"></i> CSS</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="center">
          <br />
          <div class="tx">Generate now? All previous files will be replaced with the new ones</div>
          <br />
        </div>
      </div>
      <div class="f">
        <div class="s field-cancel">
          <div class="btn btn-cancel">CANCEL</div>
        </div>
        <div class="s">
          <button class="btn btn-ok">OK</button>
        </div>
      </div>
    </div>`)
  }

  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()
      if (this.locked) return

      this.locked = true

      const modLang: Partial<IModLanguage> = {}

      const formData = new FormData(this.el)

      for (const [key, val] of formData) {
        if (key === "formgen-script-lang") {
          modLang.script = val.toString() as ModScriptLanguage
        } else if (key === "formgen-style-lang") {
          modLang.style = val.toString() as ModStyleLanguage
        }
      }

      if (!modLang.script) {
        await modal.alert("Please choose Script Language")
        this.locked = false
        return
      }

      if (!modLang.style) {
        await modal.alert("Please choose Style Language")
        this.locked = false
        return
      }

      this.locked = false

      this.setModValues(modLang as IModLanguage)
    }
  }

  private btnCancelListener(): void {
    const btnCancel = futor(".btn-cancel", this.el)
    btnCancel.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }

  private setModValues(modLang: IModLanguage): void {
    const modValues = editorModel.findValues(modLang)

    this.destroy(modLang, modValues)
  }

  noCancel(): void {
    const cancelField = futor(".field-cancel", this.el)
    cancelField.classList.add("hide")
  }

  onDone(newFunc?: (modLang?: IModLanguage, modValues?: UGMRef) => void): void {
    this.onSubmission = newFunc
  }

  destroy(modLang?: IModLanguage, modValues?: UGMRef): void {
    this.el.remove()
    if (this.onSubmission) {
      this.onSubmission(modLang, modValues)
      this.onSubmission = undefined
    }
  }

  init(): void {
    eroot().append(this.el)
    this.submitListener()
    this.btnCancelListener()
  }
}
