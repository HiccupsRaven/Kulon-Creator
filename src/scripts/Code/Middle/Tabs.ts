import { kel } from "../../lib/kel"
import { db } from "../data/db"
import { langIcons, modLangExtensions } from "../data/EditorModel"
import { EditorMiddle } from "../EditorMiddle"
import { ModLanguage } from "../types/CodeTypes"
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
        name: "customScript",
        ext: modLangExtensions[scriptType],
        ic: `brands fa-${langIcons[scriptType]}`
      })
    )

    this.list.push(
      new TabButton({
        tabs: this,
        name: "customStyle",
        ext: modLangExtensions[styleType],
        ic: `brands fa-${langIcons[styleType]}`
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
  }

  onTabSave(name: string): void {
    this.middle.textEditor?.saveModel(name)
  }

  changeTabLang(tabName: string, modLang: ModLanguage): void {
    const tab = this.list.find((itm) => itm.name === tabName)
    if (!tab) return

    tab.updateFile({
      name: tab.name,
      ic: `brands fa-${langIcons[modLang]}`,
      ext: modLangExtensions[modLang]
    })
  }

  setDirty(tabName: string, status: boolean = true): void {
    const tab = this.list.find((itm) => itm.name === tabName)
    if (tab) tab.updateStatus(status)
  }

  get dirtySize(): number {
    return this.list.filter((itm) => itm.isDirty).length
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
