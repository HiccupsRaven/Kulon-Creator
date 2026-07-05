import { transformBagPage } from "../Contents/Bag"
import { IGameSettings } from "../Creator/types/CreatorTypes"
import db from "../data/db"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import { eroot, futor, kel } from "../lib/kel"
import LoadAssets from "../lib/LoadAssets"
import waittime from "../lib/waittime"
import { Game } from "../main/Game"
import chat from "../manager/Chat"
import setNewGame from "../manager/setNewGame"
import { work } from "../manager/WorkWorld"
import { IPMC } from "../types/DBTypes"
import { SSKelement } from "../types/LibTypes"
import { resetHint } from "./Hint"

interface IStatus {
  0: string
  1: string
}

const STATUS: [IStatus, IStatus] = [
  { 0: "PAYOUT_FAILED", 1: "PAYOUT_COMPLETED" },
  { 0: "PAYOUT_LOST", 1: "PAYOUT_WON" }
]

interface IPayoutConfig {
  onComplete: () => void
  game: Game
  fail?: boolean
}

export default class Payout implements IPMC {
  id: string = "payout"
  isLocked: boolean = false
  onComplete: () => void
  private game: Game
  private fail?: boolean

  private canvas = futor(".game-canvas") as HTMLCanvasElement

  private work: IGameSettings = work.settings

  private title: string

  private multiple: number = db.job.host === db.me.id ? 3 : 1
  private eco1: number
  private eco2: number

  private el!: HTMLDivElement
  private elcrews!: SSKelement
  private etitle!: SSKelement
  private box!: SSKelement

  private crews!: NodeListOf<HTMLDivElement>
  private currCrew!: number

  private ecos!: NodeListOf<HTMLDivElement>
  private currEco!: number

  constructor(config: IPayoutConfig) {
    this.onComplete = config.onComplete
    this.game = config.game
    this.fail = config.fail || false

    this.title = STATUS[this.work.mode! - 1][this.fail ? "0" : "1"]
    if (this.fail && !this.work.mode) {
      this.eco1 = 0
      this.eco2 = 0
    } else if (this.fail && this.work.mode === 1) {
      this.eco1 = this.work.payout![0] * (2 / 100)
      this.eco2 = this.work.payout![1] * (2 / 100)
    } else if (!this.work.mode) {
      const payout1 = this.work.payout![0]
      const payout2 = this.work.payout![1]
      this.eco1 = payout1 + payout1 * (2 / 100)
      this.eco2 = payout2 + payout2 * (2 / 100)
    } else {
      this.eco1 = this.work.payout![0]
      this.eco2 = this.work.payout![1]
    }
  }
  private createElement(): void {
    this.el = kel("div", "Payout")
    if (this.fail) this.el.classList.add("fail")
    this.el.innerHTML = `
    <div class="box">
      <div class="completed">${lang[this.title]}</div>
      <div class="economies">
        <div class="eco">
          <i class="eco-desc">+${this.eco1}</i>
          <i class="eco-title">Hexsa</i>
        </div>
        <div class="eco">
          <i class="eco-desc">+${this.eco2}</i>
          <i class="eco-title">Token</i>
        </div>
      </div>
      <div class="crews">
      </div>
    </div>
    <div class="changed"></div>`
    this.elcrews = futor(".crews", this.el)
    this.etitle = futor(".completed", this.el)
    this.box = futor(".box", this.el)
  }
  private writePlayers(): void {
    db.onduty = 3
    this.work.spawn!.forEach((_, i) => {
      const uname = i === 0 ? db.me.username : `TestPlayer-${Date.now().toString(36)}`
      const card = kel("div", "crew")
      card.innerHTML = `<i>${i + 1}</i> ${uname}`
      this.elcrews.appendChild(card)
    })
  }
  private async writePayouts(): Promise<void> {
    this.canvas.classList.add("mission-complete")
    this.crews = this.el.querySelectorAll(".crew")
    this.currCrew = this.crews.length
    this.ecos = this.el.querySelectorAll(".eco")
    this.currEco = this.ecos.length
    audio.emit({ action: "play", type: "sfx", src: "stat03", options: { id: "stat03", volume: 0.6 } })
    audio.emit({ action: "play", type: "bgm", src: "statshow01", options: { id: "statshow01", fadeIn: 1000, volume: 0.8 } })
    await waittime(1000)
    await new Promise((resolve) => this.setTitle(resolve))
    await new Promise((resolve) => this.setCrew(resolve))
    await new Promise((resolve) => this.setEco(resolve))
    await waittime(3000)
    this.setBoxDown()
    this.setTransition()
    await waittime(1000)
    this.box.remove()
    this.setItems()
    await waittime(1000)
    this.canvas.classList.remove("mission-complete")
    this.backToOffline()
  }
  private async setItems(): Promise<void> {
    if (this.fail) return
    const eco1 = db.bag.findOne("420")
    const eco2 = db.bag.findOne("666")
    if (eco1) db.bag.update({ ...eco1, amount: eco1.amount + this.eco2 })
    if (eco2) db.bag.update({ ...eco2, amount: eco2.amount + this.eco1 })
  }
  private async setTitle(done: (val?: unknown) => unknown): Promise<void> {
    this.el.style.opacity = "1"
    await waittime(2000)
    audio.emit({ action: "play", type: "sfx", src: "stat01", options: { id: "stat01_" + Date.now(), volume: 0.8 } })
    await waittime(150)
    this.etitle.style.transform = "translateY(0)"
    await waittime(1500)
    done()
  }
  private async setCrew(done: (val?: unknown) => unknown): Promise<unknown | void> {
    if (this.currCrew <= 0) {
      await waittime(1000)
      return done()
    }
    audio.emit({ action: "play", type: "sfx", src: "stat01", options: { id: "stat01_" + Date.now(), volume: 0.8 } })
    await waittime(100)
    const currTranslate = Math.floor(((this.currCrew - 1) / this.crews.length) * 100)
    this.elcrews.style.transform = "translateY(-" + currTranslate + "%)"
    const currTitle = 100 / (this.currCrew + 1)
    this.etitle.style.transform = "translateY(calc(" + currTitle + "% - 1em))"
    await waittime(800)
    this.currCrew--
    this.setCrew(done)
  }
  private async setEco(done: (val?: unknown) => unknown): Promise<unknown | void> {
    if (this.currEco <= 0) {
      audio.emit({ action: "play", type: "sfx", src: "stat02", options: { id: "stat02", volume: 0.6 } })
      this.box.style.transform = "scale(1)"
      await waittime(1500)
      return done()
    }
    audio.emit({ action: "play", type: "sfx", src: "stat01", options: { id: "stat01_" + Date.now(), volume: 0.8 } })
    this.ecos[this.currEco - 1].style.transform = "translateY(-50vh)"
    await waittime(250)
    this.ecos[this.currEco - 1].style.transition = "0.1s"
    this.ecos[this.currEco - 1].style.transform = "translateY(-7em)"
    await waittime(750)
    this.ecos[this.currEco - 1].style.transition = "0.5s"
    this.currEco--
    this.setEco(done)
  }
  private setTransition(): void {
    const echanged = futor(".changed", this.el)
    echanged.style.opacity = "1"
    audio.emit({ action: "stop", type: "bgm", options: { fadeOut: 1000 } })
  }
  private setBoxDown(): void {
    audio.emit({ action: "play", type: "sfx", src: "statout", options: { id: "statout", volume: 0.7 } })
    this.box.style.transform = "translateY(100vh)"
  }
  private async backToOffline(): Promise<void> {
    resetHint()
    db.job.reset()
    db.waiting.reset()
    db.onduty = 2
    transformBagPage("1")
    await new LoadAssets({ files: work.assets }).run()
    await setNewGame(work, this.game)
    this.destroy()
  }
  async destroy(next?: IPMC): Promise<void> {
    if (this.isLocked) return
    db.onduty = 2
    this.el.classList.add("out")
    if (chat.formOpened) {
      chat.hide()
    }
    chat.clear()
    // backsong.switch(1)
    // backsong.start()
    await waittime(2000)
    db.pmc = undefined
    chat.add(db.me.id, lang.TC_LEFT, true)
    this.el.remove()
    if (!next) return this.onComplete()
    if (typeof next !== "string") return next.init()
  }
  init(): void {
    db.pmc = this
    // backsong.destroy()
    audio.emit({ action: "stop", type: "ambient", options: { fadeOut: 300 } })
    this.game.pause()
    this.createElement()
    eroot().append(this.el)
    this.writePlayers()
    this.writePayouts()
    if (db.pmx) {
      db.pmx.destroy()
      db.pmx = undefined
    }
  }
}
