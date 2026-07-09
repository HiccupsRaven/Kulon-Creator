import { kel } from "../../lib/kel"
import { db } from "../data/db"
import { modLangExtensions, scriptIcons, styleIcons } from "../data/EditorModel"
import { EditorMiddle } from "../EditorMiddle"
import { TabButton } from "./TabButton"

interface ITabsConfig {
  middle: EditorMiddle
}

export class Tabs {
  locked: boolean = false

  private el!: HTMLDivElement

  middle: EditorMiddle

  list: TabButton[] = []

  private currentFile?: string

  constructor(config: ITabsConfig) {
    this.middle = config.middle
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-tabs")
  }

  private writeData(): void {
    this.addToTabs()
    this.renderTabs()
  }

  private addToTabs(): void {
    const scriptType = db.modLanguage.script
    const styleType = db.modLanguage.style

    this.list.push(
      new TabButton({
        tabs: this,
        name: "CustomScript",
        ext: modLangExtensions[scriptType],
        ic: `brands fa-${scriptIcons[scriptType]}`
      })
    )

    this.list.push(
      new TabButton({
        tabs: this,
        name: "CustomStyle",
        ext: modLangExtensions[styleType],
        ic: `brands fa-${styleIcons[styleType]}`
      })
    )

    this.list.push(
      new TabButton({
        tabs: this,
        name: "assets",
        ext: "json",
        ic: "regular fa-brackets-curly"
      })
    )
  }

  private renderTabs(): void {
    this.list.forEach((tab) => {
      this.el.append(tab.html)
      tab.init()
    })
  }

  activate(name: string): void {
    if (this.currentFile && this.currentFile === name) return
    this.list.forEach((itm) => itm.activate(itm.name === name))
  }

  onTabSwitch(name: string): void {
    this.middle.textEditor?.switchEditor(name)

    if (this.currentFile && this.currentFile === name) return
    if (this.middle.editor.locked) return

    this.activate(name)
  }

  onTabSave(name: string): void {
    console.log(`Saving ${name}`)
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
