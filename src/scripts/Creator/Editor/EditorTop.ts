import versions from "../../APIs/version.json"
import { futor, kel, qutor } from "../../lib/kel"
import modal from "../../lib/modal"
import { Dashboard } from "../Dashboard"
import { Editor } from "../Editor"
import { ITileAction } from "../types/CreatorTypes"

interface EditorTopConfig {
  editor: Editor
}

export class EditorTop {
  locked: boolean = false
  private el!: HTMLDivElement
  editor: Editor

  constructor(s: EditorTopConfig) {
    this.editor = s.editor
  }
  private createElement(): void {
    this.el = kel("div", "EditorTop")
    this.el.innerHTML = `
    <div class="left">
      <img src="/images/logo.svg" alt="Devanka 761 Logo" title="Devanka HiccupsRaven Logo" width="20" />
      <p>Kulon Creator v${versions.package}</p>
    </div>
    <div class="right">
      <div class="right-tile">
        <div x-tileaction="bulk" class="btn btn-tile"><div>Bulk</div><div class="help">Select several tiles to combine into a space cutscene</div></div>
        <div class="btn btn-tile-help"><i class="fa-duotone fa-circle-question"></i><div class="help"><span class="help-info red"></span> Walls<br/><span class="help-info blue"></span> Objects<br/><span class="help-info green"></span> Cutscene Spaces<br/><span class="help-info black"></span> Teleporters<br/><span class="help-info white"></span> Waiting on Bulk</div></div>
        <div x-tileaction="wall" class="btn btn-tile active"><div>Wall</div><div class="help">Select a tile to assign a collision</div></div>
        <div x-tileaction="cutscene" class="btn btn-tile"><div>Cutscene</div><div class="help">Select a tile to assign a cutscene space</div></div>
        <div x-tileaction="object" class="btn btn-tile"><div>Object</div><div class="help">Select a tile to asign an object, NPC, or prop</div></div>
        <div x-tileaction="teleporter" class="btn btn-tile"><div>Teleporter</div><div class="help">Select a tile to place the teleporter</div></div>
      </div>
      <div class="right-close">
        <div class="btn btn-close"><i class="fa-solid fa-xmark"></i></div>
      </div>
    </div>`
  }

  private closeListener(): void {
    const btnClose = futor(".right-close .btn-close", this.el)
    btnClose.onclick = async () => {
      if (this.editor.locked) return
      this.locked = true
      const confExit = await modal.confirm({ msg: "Exit now? Any unsaved modification will be gone.", okx: "YES, EXIT!", cancelx: "NO, STAY HERE" })

      if (!confExit) {
        this.locked = false
        return
      }

      this.locked = false

      const dashboard = new Dashboard()
      this.editor.destroy(dashboard)
    }
  }
  private tileActionListener(): void {
    const btnTiles = this.el.querySelectorAll(".right-tile .btn-tile") as NodeListOf<HTMLDivElement>
    btnTiles.forEach((btn) => {
      btn.onclick = async () => {
        const actionType = btn.getAttribute("x-tileaction") as ITileAction

        const hasBulkBefore = this.editor.checkFromBulk()

        if (actionType === "cutscene") {
          if (hasBulkBefore) return this.editor.bulkNewCutscene()
        } else if (hasBulkBefore) {
          this.lock()
          await modal.alert("Bulk can only assigned to cutscenes! Remove all tiles marked as bulk list to switch to other mode.")
          this.lock(false)
          return
        }

        const canSwitch = await this.editor.setTileAction(actionType)
        if (!canSwitch) {
          return
        }

        const oldActive = qutor(".btn-tile.active", this.el)
        if (oldActive) oldActive.classList.remove("active")
        btn.classList.add("active")
      }
    })
  }

  lock(status: boolean = true): void {
    this.locked = status
  }
  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.closeListener()
    this.tileActionListener()
    return this
  }
}
