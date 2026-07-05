import { futor, kel } from "../../lib/kel"
import { db } from "../data/db"
import { toggleFullScreen } from "../data/fullScreen"
import { work } from "../data/work"
import { Editor } from "../Editor"
import { validateProject } from "../lib/ValidateProject"
import { doTell } from "../lib/tell"
import { idb } from "../../lib/idb"

interface EditorBottomConfig {
  editor: Editor
}

let savedTimeout: null | ReturnType<typeof setTimeout>

export class EditorBottom {
  locked: boolean = false
  private el!: HTMLDivElement
  editor: Editor
  constructor(s: EditorBottomConfig) {
    this.editor = s.editor
  }
  private createElement(): void {
    this.el = kel("div", "EditorBtm")
    this.el.innerHTML = `
    <div class="left">
      <div class="zoom">
        <div class="btn btn-fullscreen" title="Toggle Fullscreen">
          <i class="fa-regular fa-expand fa-fw"></i> <span>Toogle Fullscreen</span>
        </div>
        <div class="btn btn-gotocenter" title="Go To Center">
          <i class="fa-regular fa-location-crosshairs fa-fw"></i> <span>Go To Center</span>
        </div>
        <div class="btn btn-zoom-in" title="Zoom-In">
          <i class="fa-regular fa-magnifying-glass-plus fa-fw"></i> <span>Zoom-In</span>
        </div>
        <div class="btn btn-zoom-out" title="Zoom-Out">
          <i class="fa-regular fa-magnifying-glass-minus fa-fw"></i> <span>Zoom-Out</span>
        </div>
      </div>
      <div class="info">
        <p><span><i class="fa-light fa-grid"></i></span> <span class="coor-exact">x y</span> <span><i class="fa-light fa-frame"></i></span> <span class="coor-grid">x y</span></p>
      </div>
    </div>

    <div class="right">
      <div class="btn btn-publish">Publish <i class="fa-jelly-fill fa-regular fa-arrow-up"></i></div>
      <div class="btn btn-test">Test <i class="fa-jelly-fill fa-regular fa-play"></i></div>
      <div class="btn btn-save">Save <i class="fa-solid fa-floppy-disk"></i></div>
    </div>`
  }
  private fullScreenListener(): void {
    const btnFullScreen = futor(".left .zoom .btn-fullscreen", this.el)
    btnFullScreen.onclick = () => toggleFullScreen()
  }
  private centerizeListener(): void {
    const btnCenter = futor(".left .zoom .btn-gotocenter", this.el)
    btnCenter.onclick = () => this.editor.middle.canvas.target.centerize()
  }
  private saveListener(): void {
    const btnSave = futor(".right .btn-save", this.el)
    btnSave.onclick = async () => {
      if (this.editor.locked) return
      this.locked = true
      btnSave.style.width = `${btnSave.clientWidth.toString()}px`
      btnSave.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'

      const projectValid = await validateProject.project(work, db.startend, db.items, db.settings)

      if (!projectValid) {
        btnSave.style.width = "fit-content"
        btnSave.innerHTML = `Save <i class="fa-solid fa-floppy-disk"></i>`
        this.locked = false
        return
      }

      const id = db.meta.id
      idb.data[id].maps = work
      idb.data[id].items = db.items
      idb.data[id].startend = db.startend
      idb.data[id].settings = db.settings
      idb.data[id].meta = db.meta

      idb.save(id)

      this.locked = false
      btnSave.innerHTML = '<i class="fa-solid fa-check"></i>'
      doTell("Project Saved")
      this.savedStyler(btnSave as HTMLDivElement)
    }
  }

  private testListener(): void {
    const btnTest = futor(".right .btn-test", this.el)
    btnTest.onclick = async () => {
      if (this.editor.locked) return
      this.locked = true
      btnTest.style.width = `${btnTest.clientWidth.toString()}px`
      btnTest.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'

      const projectValid = await validateProject.project(work, db.startend, db.items, db.settings, true)

      if (!projectValid) {
        btnTest.style.width = "fit-content"
        btnTest.innerHTML = `Test <i class="fa-jelly-fill fa-regular fa-play"></i>`
        this.locked = false
        return
      }

      const id = db.meta.id
      idb.data[id].maps = work
      idb.data[id].items = db.items
      idb.data[id].startend = db.startend
      idb.data[id].settings = db.settings
      idb.data[id].meta = db.meta

      idb.save(id)

      this.locked = false
      doTell("Project Saved")
      window.location.href = `/testplay.html?ugc=${db.meta.id}`
      btnTest.innerHTML = 'Test <i class="fa-jelly-fill fa-regular fa-play"></i>'
    }
  }

  private savedStyler(btnSave: HTMLDivElement): void {
    if (savedTimeout) {
      clearTimeout(savedTimeout)
      savedTimeout = null
    }
    savedTimeout = setTimeout(() => {
      if (this.locked) return
      btnSave.style.width = "fit-content"
      btnSave.innerHTML = 'Save <i class="fa-solid fa-floppy-disk"></i>'
    }, 3000)
  }
  updateCoor(x: number, y: number, gridX: number, gridY: number): void {
    const coorExact = futor(".coor-exact", this.el)
    coorExact.innerHTML = `${x} ${y}`
    const coorGrid = futor(".coor-grid", this.el)
    coorGrid.innerHTML = `${gridX} ${gridY}`
  }
  lock(status: boolean = true): void {
    this.locked = status
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.fullScreenListener()
    this.centerizeListener()
    this.saveListener()
    this.testListener()
    return this
  }
}
