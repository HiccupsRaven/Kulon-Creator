import { futor, kel } from "../../../lib/kel"
import { db } from "../../data/db"
import { EditorMiddle } from "../EditorMiddle"
import { EditorFiles } from "./Sys/EditorFiles"
import { EditorMaps, EditorMapsConfig } from "./Sys/EditorMaps"

interface EditorSysConfig {
  middle: EditorMiddle
}

type ISysNav = {
  id: string
  name: string
  run(s: EditorMapsConfig): EditorMaps | EditorFiles
}

const sysNavs: ISysNav[] = [
  {
    id: "maps",
    name: "Maps",
    run(s) {
      return new EditorMaps(s)
    }
  },
  {
    id: "files",
    name: "Files",
    run(s) {
      return new EditorFiles(s)
    }
  }
]

export class EditorSys {
  locked: boolean = false
  private el!: HTMLDivElement
  middle!: EditorMiddle

  field!: EditorMaps | EditorFiles

  private boxMenu!: HTMLDivElement
  private currentMenu?: string

  constructor(s: EditorSysConfig) {
    this.middle = s.middle
  }
  private createElement(): void {
    this.el = kel("div", "left")
    this.el.innerHTML = `
    <div class="box">
      <div class="box-project">Loading</div>
      <div class="box-menu"></div>
      <div class="box-content">
      </div>
    </div>`
  }
  updateTitle(): void {
    const title = futor(".box .box-project", this.el)
    title.innerText = db.settings.project
  }
  private writeMenu(): void {
    this.boxMenu = futor(".box .box-menu", this.el) as HTMLDivElement

    sysNavs.forEach((menu) => {
      const el = this.createMenu(menu)
      this.boxMenu.append(el)
    })

    this.field = new EditorMaps({ sys: this }).init()
    this.updateContent()
    this.updateMenu("maps")
  }
  private createMenu(data: ISysNav): HTMLDivElement {
    const menu = kel("div", `btn menu-${data.id}`)
    menu.innerHTML = data.name

    menu.onclick = async () => {
      if (this.middle.editor.locked) return
      if (this.currentMenu === data.id) return

      this.updateMenu(data.id)
      this.field.destroy()
      this.field = data.run({ sys: this }).init()
      this.updateContent()
    }

    return menu
  }

  updateMenu(menuId: string): void {
    if (this.currentMenu === menuId) return

    this.currentMenu = menuId

    this.boxMenu.querySelectorAll(".btn").forEach((btn) => {
      if (btn.classList.contains(`menu-${menuId}`)) {
        btn.classList.add("active")
      } else {
        btn.classList.remove("active")
      }
    })
  }
  updateContent(): void {
    const boxContent = futor(".box .box-content", this.el)
    boxContent.append(this.field.html)
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.updateTitle()
    this.writeMenu()
    this.updateContent()
    return this
  }
}
