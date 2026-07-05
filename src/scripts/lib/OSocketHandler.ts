import db from "../data/db"
import { Game } from "../main/Game"
import { IAny } from "../types/LibTypes"
import audio from "./AudioHandler"
import waittime from "./waittime"

type Resolve = (val?: IAny) => void

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

class SocketHandler {
  private game!: Game
  jobSetItem(data: IAny): void {
    const { item } = data
    db.job.setItem(item)
  }
  async payout(): Promise<void> {
    const checkCutscene = async (resolve: Resolve) => {
      if ([1, 3].includes(db.onduty)) {
        return resolve(false)
      } else if (this.game.isCutscenePlaying) {
        await waittime(100)
        return await checkCutscene(resolve)
      }
      return resolve(true)
    }

    const allowed = await new Promise((resolve) => checkCutscene(resolve))
    if (!allowed) return

    this.game.startCutscene([{ type: "payout", crew: true }])
  }
  async winners(data: IAny): Promise<void> {
    const newTs = data.tss
    Object.keys(newTs).forEach((userId) => db.job.setTs(userId, -newTs[userId]))

    const checkCutscene = async (resolve: Resolve) => {
      if ([1, 3].includes(db.onduty)) {
        return resolve(false)
      } else if (this.game.isCutscenePlaying) {
        await waittime(100)
        return await checkCutscene(resolve)
      }
      return resolve(true)
    }

    const allowed = await new Promise((resolve) => checkCutscene(resolve))
    if (!allowed) return

    this.game.startCutscene([{ type: "winner", winners: data.winners }])
  }
  addClaims(data: IAny): void {
    if (!db.pmx) return

    const states = data.states
    const owner = data.owner

    if (!states || !owner) return
    if (!Array.isArray(states)) return

    audio.emit({ action: "play", type: "sfx", src: "collect", options: { id: Date.now().toString() } })

    states.forEach((state) => db.pmx!.addClaim(state, owner))

    this.game.kulonUI?.phone.updateUnread()
  }
  run(data: IAny): void {
    if (!this.game || !data.type) return
    if (INVALID_CONTROLS.find((control) => control === data.type)) return
    const type = data.type as keyof SocketHandler
    if (this[type]) {
      this[type](data)
    }
  }
  init(game: Game) {
    this.game = game
  }
}

const socketHandler = new SocketHandler()
export default socketHandler
