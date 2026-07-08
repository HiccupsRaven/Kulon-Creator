import { kel } from "../../lib/kel"
import { EditorMiddle } from "../EditorMiddle"

interface ITabsConfig {
  middle: EditorMiddle
}

export class Tabs {
  locked: boolean = false

  private el!: HTMLDivElement

  middle: EditorMiddle

  constructor(config: ITabsConfig) {
    this.middle = config.middle
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-tabs")
    this.el.innerHTML = `
    <div class="btn kulon-code-tab active unsaved">
      <div class="file"><i class="fa-brands fa-typescript fa-fw"></i> CustomScript.ts</div>
      <div class="status"><i class="fa-solid fa-floppy-disk fa-fw"></i></div>
    </div>
    <div class="btn kulon-code-tab unsaved">
      <div class="file"><i class="fa-brands fa-sass fa-fw"></i> CustomStyle.scss</div>
      <div class="status"><i class="fa-solid fa-floppy-disk fa-fw"></i></div>
    </div>`
  }

  private writeData(): void {}

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
