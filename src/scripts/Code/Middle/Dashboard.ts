import { idb } from "../../lib/idb"
import { futor, kel } from "../../lib/kel"
import sdate from "../../lib/sdate"
import { setInitDB } from "../data/db"
import { langIcons } from "../data/EditorModel"
import { EditorMiddle } from "../EditorMiddle"
import { UGMRefExtended, UGMTree } from "../types/CodeTypes"
import { GenerateModValues } from "./GenerateModValues"

interface IDashboardConfig {
  middle: EditorMiddle
}

function initialCard(text: string): HTMLDivElement {
  const el = kel("div", "card-loading")
  el.innerHTML = text
  return el
}

export class Dashboard {
  locked: boolean = false

  private el!: HTMLDivElement

  middle: EditorMiddle

  private field!: HTMLDivElement

  constructor(config: IDashboardConfig) {
    this.middle = config.middle
  }

  private createElement(): void {
    this.el = kel("div", "kulon-code-folder")
    this.el.innerHTML = `
    <div class="folder-list">
    </div>`

    this.field = futor(".folder-list", this.el, "div")
  }

  private async writeData(): Promise<void> {
    this.middle.lock()

    const cardLoading = initialCard('<i class="fa-solid fa-circle-notch fa-spin"></i> Loading')

    this.field.append(cardLoading)

    const ugmTree: UGMTree[] = await idb.getModsTree()

    this.checkEmtpy(ugmTree, cardLoading)

    this.middle.lock(false)

    ugmTree
      .sort((a, b) => {
        if (a.modified > b.modified) return -1
        if (a.modified < b.modified) return 1
        return 0
      })
      .forEach((ugm) => {
        const card = this.createCard(ugm)
        this.field.append(card)
      })
  }

  private createCard(ugm: UGMTree): HTMLDivElement {
    const card = kel("div", "card")

    card.innerHTML = `
    <div class="card-info">
      <div class="card-icons">
        <i class="fa-solid fa-folder-open fa-fw"></i>
      </div>
      <div class="card-meta">
        <div class="meta-title">Loading</div>
        <div class="meta-sub">Loading</div>
      </div>
    </div>
    <div class="card-tech">
      <span><i class="fa-brands fa-typescript fa-fw"></i></span>
      <span><i class="fa-brands fa-sass fa-fw"></i></span>
    </div>`

    const cardTitle = futor(".card-meta .meta-title", card)
    cardTitle.innerText = ugm.project

    const cardDate = futor(".card-meta .meta-sub", card)
    cardDate.innerText = `${sdate.parseTime(ugm.created)} • Last Modified: ${sdate.parseTime(ugm.modified)}`

    const eTech = futor(".card-tech", card, "div")

    if (ugm.modLanguage) {
      const faScriptIcon = langIcons[ugm.modLanguage.script]

      const techScript = kel("i", `fa-brands fa-${faScriptIcon} fa-fw`)

      const faStyleIcon = langIcons[ugm.modLanguage.style]

      const techStyle = kel("i", `fa-brands fa-${faStyleIcon} fa-fw`)

      eTech.append(techScript, techStyle)
    } else {
      eTech.innerHTML = '<i class="fa-solid fa-brackets-curly"></i>'
    }

    card.onclick = () => this.setModValues(ugm)

    return card
  }

  private async setModValues(ugm: UGMTree): Promise<void> {
    if (this.middle.editor.locked) return
    this.middle.lock()

    const modValues: UGMRefExtended = await idb.getModValues(ugm.id)

    if (ugm.modLanguage && modValues.script && modValues.style) {
      return this.goToTextEditor(ugm, modValues)
    }

    const genModValues = new GenerateModValues()
    genModValues.onDone((modLang, newModVal) => {
      if (!modLang || !newModVal) {
        this.middle.lock(false)
        return
      }
      this.goToTextEditor({ ...ugm, modLanguage: modLang }, { ...modValues, ...newModVal })
    })
    // genModValues.noCancel()
    genModValues.init()
  }

  private async goToTextEditor(ugm: UGMTree, modValues: UGMRefExtended): Promise<void> {
    setInitDB(ugm, modValues)

    this.middle.editor.top.setProjectName(ugm.id, ugm.project)

    this.middle.lock(false)

    this.middle.endDashboard()

    this.middle.startTextEditor()
  }

  private checkEmtpy(ugmList: UGMTree[], card?: HTMLDivElement): void {
    const cardLoading = card ?? initialCard('<i class="fa-solid fa-circle-notch fa-spin"></i> Loading')

    if (ugmList.length < 1) {
      this.field.append(cardLoading)
      cardLoading.innerHTML = '<i class="fa-regular fa-face-kiss-wink-heart fa-2x"></i> <br /><span>You might want to <a href="/index.html">Create New Project</a> first?</span>'
      return
    }

    cardLoading.remove()
  }

  get html(): HTMLDivElement {
    return this.el
  }

  destroy(): void {
    this.locked = false
    this.el.remove()
  }

  init(): this {
    this.createElement()
    this.writeData()
    return this
  }
}
