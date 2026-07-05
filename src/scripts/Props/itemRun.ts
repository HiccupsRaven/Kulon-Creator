import db from "../data/db"
import modal from "../lib/modal"
import { Game } from "../main/Game"
import { IAny } from "../types/LibTypes"
import Paper from "../Events/Paper"
import { paperGet } from "../data/notes"

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class ItemRun {
  readonly id = "itemrun"
  private game!: Game
  isLocked: boolean = false
  async readnote(config: IAny): Promise<void> {
    const note = paperGet(config.id)
    if (!note) return config.onComplete()

    const paper = new Paper({
      onComplete: config.onComplete,
      classBefore: config.classBefore,
      name: note.name,
      text: note.text
    })
    paper.init()
  }
  run(runId: string, config: IAny = {}) {
    db.pmc = this
    return {
      init: async () => {
        if (INVALID_CONTROLS.find((control) => control === runId)) return config.classBefore.init()

        // @ts-expect-error no default
        if (this[runId]) return this[runId](config)

        await modal.alert({ ic: "helmet-safety", msg: "UNDER DEVELOPMENT" })
        return config.classBefore.init()
      }
    }
  }
  init(game: Game) {
    this.game = game
  }
}
const itemRun = new ItemRun()
export default itemRun
