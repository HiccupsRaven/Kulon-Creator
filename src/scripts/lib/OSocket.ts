import db from "../data/db"
// import socketHandler from "./OSocketHandler"
import { setPeerConfig } from "../data/peer.config"
import audio from "./AudioHandler"
import { Game } from "../main/Game"
import { IAny } from "../types/LibTypes"

// function socketError(_err: Event) {
//   // console.error(err)
// }
// function socketMessage(data: MessageEvent) {
//   try {
//     const msg = JSON.parse(data.data.toString())
//     socketHandler.run(msg)
//   } catch (_err) {
//     // console.error(err)
//   }
// }

class Socket {
  private isExited: number = 0
  private game!: Game
  setExit(newExit: number): void {
    this.isExited = newExit
  }
  close(): void {}
  send(type: string, _obj = {}): void {
    // const data = { type, identifier: "kulon", ...obj }
    // if (this.ws && this.ws.readyState === this.ws.OPEN) {
    //   this.ws.send(JSON.stringify(data))
    // }
  }
  endGameProcess(): void {
    audio.stopAll()
    // backsong.destroy(2000)
    db.pmc?.destroy?.()
    this.game.destroy()
  }
  private _resetOldData(): void {
    db.bag.reset()
    if (db.onduty < 2) {
      db.job.reset()
    }
  }
  updateData(s: IAny): void {
    this._resetOldData()
    if (s.provider) db.provider = s.provider
    if (s.me) db.me = s.me
    if (s.bag) db.bag.bulkUpdate(s.bag)
    if (s.peer) setPeerConfig(s.peer)
    if (s.build) db.version = s.build
  }
  init(game: Game) {
    this.game = game
  }
}

const socket = new Socket()
export default socket
