import { futor, kel } from "../lib/kel"
import { Editor } from "./Editor"

interface IEditorTopConfig {
  editor: Editor
}

export class EditorTop {
  locked: boolean = false

  private el!: HTMLDivElement

  editor: Editor

  constructor(config: IEditorTopConfig) {
    this.editor = config.editor

    this.createElement()
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-top")
    this.el.innerHTML = `
    <div class="kulon-code-top-left">
      <img src="/images/logo.svg" alt="Devanka 761 Logo" title="Devanka HiccupsRaven Logo" width="20" />
      <p>Kulon Custom Game Code</p>
    </div>
    <div class="kulon-code-top-mid">root:/kulon/usr/$_find/$_x${Date.now().toString(36)}/~#</div>
    <div class="kulon-code-top-right">
      <div class="btn btn-close"><i class="fa-solid fa-xmark"></i></div>
    </div>`
  }

  private writeData(): void {}

  setProjectName(projectId: string, projectName: string): void {
    const eProjectName = futor(".kulon-code-top-mid", this.el)
    eProjectName.innerText = `root:/kulon/usr/${projectName}/~$ ${projectId}`
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
