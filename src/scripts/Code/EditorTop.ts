import { toText } from "../Creator/lib/gen"
import { futor, kel } from "../lib/kel"
import modal from "../lib/modal"
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
    <div class="kulon-code-top-mid"><div class="top-mid-path">root:/kulon/usr/$_find/$_x${Date.now().toString(36)}/~#</div></div>
    <div class="kulon-code-top-right">
      <div class="btn btn-close"><i class="fa-solid fa-xmark"></i></div>
    </div>`
  }

  private btnCloseListener(): void {
    const btnClose = futor(".btn-close", this.el)

    btnClose.onclick = async () => {
      if (this.editor.locked) return
      this.locked = true
      const confExit = await modal.confirm({ msg: "Exit now? Any unsaved modification will be gone.", okx: "YES, EXIT!", cancelx: "NO, STAY HERE" })

      if (!confExit) {
        this.locked = false
        return
      }

      this.locked = false

      if (window.opener) {
        window.close()
      } else {
        window.location.href = "/index.html"
      }
    }
  }

  setProjectName(projectId: string, projectName: string): void {
    const eProjectName = futor(".kulon-code-top-mid .top-mid-path", this.el)
    eProjectName.innerHTML = `<span>root:/kulon/usr/</span>"<span class="path-name">${toText(projectName)}</span>"<span>/~$ ${projectId}</span>`
  }

  lock(status: boolean = true): void {
    this.locked = status
  }

  get html(): HTMLDivElement {
    return this.el
  }

  init(): this {
    this.btnCloseListener()
    return this
  }
}
