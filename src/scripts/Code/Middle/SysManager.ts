import { kel } from "../../lib/kel"
import { EditorMiddle } from "../EditorMiddle"

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
          <label for="style-lang-less">
            <input type="radio" name="style-lang" id="style-lang-less" value="less" />
            <span><i class="fa-brands fa-less fa-fw"></i> Less</span>
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

  private writeData(): void {}

  get html(): HTMLDivElement {
    return this.el
  }

  init(): this {
    this.createElement()
    this.writeData()
    return this
  }
}
