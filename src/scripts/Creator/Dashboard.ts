import { UGCRef } from "./types/CreatorTypes"
import { eroot, futor, kel } from "../lib/kel"
import modal from "../lib/modal"
import xhr from "../lib/xhr"
import waittime from "../lib/waittime"
import { db } from "./data/db"
import LoadAssets from "../lib/LoadAssets"
import { Editor } from "./Editor"
import { setWorkSpace } from "./data/work"
import sdate from "../lib/sdate"
import { toObject } from "./lib/gen"
import { EditorDeleteProject } from "./Editor/EditorDeleteProject"
import { doTell } from "./lib/tell"
import { idb } from "../lib/idb"
import { addToGlobalUrl } from "../lib/globalURL"

function initialCard(text: string): HTMLDivElement {
  const el = kel("div", "card card-loading")
  el.innerHTML = text
  return el
}

async function initialLoad(): Promise<void> {
  const skins = await xhr.get("/json/skins/skin_list.json?v=" + Date.now())

  const sounds = await xhr.get("/json/audio/audio.json?v=" + Date.now())

  await new LoadAssets({ files: [...db.assets, ...skins, ...sounds] }).run()
}

export class Dashboard {
  private el!: HTMLDivElement
  private field!: HTMLDivElement
  locked: boolean = false
  private createElement(): void {
    this.el = kel("div", "Dashboard")
    this.el.innerHTML = `
    <div class="Dashboard-Content">
      <div class="Dashboard-About">
        <div class="Dashboard-Meta">
          <div class="Dashboard-Title">Kulon Game Creator</div>
          <div class="Dashboard-Desc">by <a href="https://devanka.id" target="_blank">Devanka 761</a></div>
        </div>
      </div>
      <div class="Dashboard-List">
      </div>
    </div>
    <div class="Dashboard-Actions">
      <div class="btn btn-new-project"><i class="fa-solid fa-plus"></i> <span>New Project</span></div>
    </div>`
    this.field = futor(".Dashboard-List", this.el) as HTMLDivElement
  }
  private async writeData(): Promise<void> {
    this.locked = true
    const cardLoading = initialCard('<i class="fa-solid fa-circle-notch fa-spin"></i> Loading')
    this.field.append(cardLoading)

    await idb.load()

    const ugcData = idb.data

    const ugcList = Object.keys(ugcData)

    this.locked = false

    this.checkEmpty(ugcList, cardLoading)

    ugcList
      .sort((a, b) => {
        if (ugcData[a].meta.modified > ugcData[b].meta.modified) return -1
        if (ugcData[a].meta.modified < ugcData[b].meta.modified) return 1
        return 0
      })
      .forEach((k) => {
        const card = this.createCard(ugcData[k])
        this.field.append(card)
      })
  }
  checkEmpty(ugcList: string[], card?: HTMLDivElement): void {
    const cardLoading = card ?? initialCard('<i class="fa-solid fa-circle-notch fa-spin"></i> Loading')

    if (ugcList.length < 1) {
      this.field.append(cardLoading)
      cardLoading.innerHTML = '<i class="fa-regular fa-face-kiss-wink-heart fa-2x"></i><br/>Create New Project To Start'
      return
    }

    cardLoading.remove()
  }
  createCard(ugc: UGCRef): HTMLDivElement {
    const card = kel("div", "card")
    card.innerHTML = `
    <div class="card-meta">
      <div class="meta">
        <div class="meta-title">
          <p></p>
        </div>
        <div class="meta-sub">
          <p></p>
        </div>
      </div>
      <i class="fa-solid fa-pen"></i>
    </div>
    <div class="card-actions">
      <div class="btn btn-delete"><i class="fa-solid fa-trash-can fa-fw"></i></div>
    </div>`
    const cardTitle = futor(".card-meta .meta-title p", card)
    cardTitle.innerText = ugc.settings.project!

    const cardDate = futor(".card-meta .meta-sub p", card)
    cardDate.innerText = `${sdate.parseTime(ugc.meta.created)} • Last Modified: ${sdate.parseTime(ugc.meta.modified)}`

    const cardName = futor(".card-meta", card)
    const cardDel = futor(".card-actions .btn-delete", card)

    cardName.onclick = () => this.goToEditor(ugc)

    cardDel.onclick = async () => {
      if (this.locked) return
      this.locked = true
      const confDel = await modal.confirm("Are you 100% sure to delete this project?")
      if (!confDel) {
        this.locked = false
        return
      }

      const editorDelete = new EditorDeleteProject(ugc)
      editorDelete.onDone((s?: boolean) => {
        this.locked = false
        if (!s) return
        this.deleteProject(ugc.meta.id)
        card.remove()
      })

      editorDelete.init()
    }

    return card
  }
  private async deleteProject(id: string): Promise<void> {
    await idb.deleteProject(id)

    doTell("Project Deleted")

    this.checkEmpty(Object.keys(idb.data))
  }
  async createListener(): Promise<void> {
    const btnNew = futor(".btn-new-project", this.el)
    btnNew.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const projectName = await modal.prompt("New Project Name:")
      if (!projectName) {
        this.locked = false
        return
      }

      const createdProject = await modal.loading(idb.create(projectName), "CREATING")

      if (!createdProject) {
        console.error("Error Creating Project")
        await modal.alert("Error Creating Project")
        this.locked = false
        return
      }

      this.locked = false
      this.goToEditor(createdProject)
    }
  }

  async goToEditor(ugc: UGCRef): Promise<void> {
    if (this.locked) return
    this.locked = true

    db.items = toObject(ugc.items)
    db.maps = toObject(ugc.maps)
    setWorkSpace(db.maps)
    db.startend = toObject(ugc.startend)
    db.settings = toObject(ugc.settings)
    db.meta = toObject(ugc.meta)

    const sanitizeAssets = await addToGlobalUrl(ugc.meta.id, toObject(ugc.assets))
    db.assets = toObject(sanitizeAssets)

    await modal.loading(initialLoad())

    const editor = new Editor()

    this.locked = false

    this.destroy(editor)
  }
  async destroy(editor?: Editor): Promise<void> {
    if (this.locked) return
    this.locked = true
    this.el.classList.add("out")
    await waittime()
    this.el.remove()
    this.locked = false
    if (editor) editor.init()
  }
  clearData(): void {
    db.maps = {}
    db.assets = []
    db.items = []
    db.startend = {}
    db.meta = { created: 0, modified: 0, id: "noid", files: 0 }
    db.settings = { project: "noname" }
  }
  init(): void {
    this.clearData()
    this.createElement()
    eroot().append(this.el)
    this.createListener()
    this.writeData()
  }
}
