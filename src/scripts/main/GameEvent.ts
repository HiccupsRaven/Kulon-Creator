import SaveList from "../data/SaveList"
import TextMessage from "../Events/TextMessage"
import MapList from "../data/MapList"
import { GameMap } from "./GameMap"
import SceneTransition from "./SceneTransition"
import Choices from "../Events/Choice"
import Phone from "../Events/Phone"
import { eroot } from "../lib/kel"
import waittime from "../lib/waittime"
import notip from "../lib/notip"
import db from "../data/db"
import LocalList from "../data/LocalList"
import Payout from "../Events/Payout"
import socket from "../lib/OSocket"
import chat from "../manager/Chat"
import modal from "../lib/modal"
import lang from "../data/language"
import audio from "../lib/AudioHandler"
import localSave from "../manager/storage"
import Setting from "../Contents/Setting"
import { IObjectEvent } from "../types/MapsTypes"
import { Game } from "./Game"
import { Person } from "./Person"
import { paperAdd, paperGet } from "../data/notes"
import Paper from "../Events/Paper"
import { Prop } from "./Prop"
import { Interactable } from "./Interactable"
import { checkHint, setHint } from "../Events/Hint"
import { objective } from "../manager/Objectives"
import { checkMissionEnd, work } from "../manager/WorkWorld"
import cloudItem from "../data/cloudItems"

type Resolve = (val?: string) => void

const INVALID_CONTROLS = ["run", "init", "constructor", "game"]

export class GameEvent {
  constructor(
    private game: Game,
    private event: IObjectEvent,
    private targetIdx?: number,
    private targetKey?: string
  ) {}

  stand(resolve: Resolve): void {
    const { who, direction, time } = this.event
    if (!who) return resolve()

    const target = this.game.map.gameObjects[who] as Person

    if (target && typeof target.startBehavior === "function") {
      target.startBehavior(
        { map: this.game.map },
        {
          type: "stand",
          direction: direction || "down",
          time: time,
          onComplete: resolve
        }
      )
    } else {
      // console.warn(`Game object '${who}' is not found.`)
      resolve()
    }
  }

  async walk(resolve: Resolve): Promise<void> {
    const { walk } = this.event

    if (!walk) return resolve()

    let endWalk: number = walk.length

    const checkEndWalk = (passResolve: Resolve) => {
      endWalk--
      if (endWalk < 1) return passResolve()
    }

    for (const walkEvent of walk) {
      const { who, direction } = walkEvent

      if (!who || !direction) return checkEndWalk(resolve)

      const target = this.game.map.gameObjects[who] as Person

      if (target && typeof target.startBehavior === "function") {
        target.startBehavior(
          { map: this.game.map },
          {
            type: "walk",
            direction: direction,
            onComplete: () => checkEndWalk(resolve)
          }
        )
      } else {
        // console.warn(`Game object '${who}' is not found.`)
        checkEndWalk(resolve)
      }
    }
  }

  changeMap(resolve: Resolve): void {
    const TILE_SIZE = 16

    if (!this.event.x || !this.event.y || !this.event.map) return resolve()

    if (this.event.door) audio.emit({ action: "play", type: "sfx", src: "door_open" })

    audio.emit({
      action: "stop",
      type: "ambient",
      options: { fadeOut: 1000 }
    })

    const sceneTransition = new SceneTransition()
    sceneTransition.init(eroot(), async () => {
      if (!this.event.x || !this.event.y || !this.event.map) return resolve()

      const newMapConfig = MapList[this.event.map]
      this.game.map = new GameMap(newMapConfig)

      await this.game.map.loadPromise

      this.game.player = this.game.map.getPlayer()

      this.game.player.x = this.event.x * TILE_SIZE
      this.game.player.y = this.event.y * TILE_SIZE
      this.game.player.direction = this.event.direction || "down"

      this.game.camera.mapWidth = this.game.map.bottomImage.width
      this.game.camera.mapHeight = this.game.map.bottomImage.height

      this.game.lastTriggeredCutsceneKey = null

      sceneTransition.fadeOut()
      if (this.event.door) audio.emit({ action: "play", type: "sfx", src: "door_close" })
      resolve()
    })
  }

  textMessage(resolve: Resolve): void {
    const { text, name } = this.event
    if (!text) return resolve()

    const message = new TextMessage({ text, name, onComplete: () => resolve() })
    message.init()
  }

  choices(resolve: Resolve): void {
    const { options, name, text } = this.event
    if (!options || !text) return resolve()

    const menu = new Choices({
      options,
      name,
      text,
      // noCancel: this.event.noCancel || false,
      onComplete: (didnext?: string | null) => resolve(didnext ? "CONTINUE" : "BREAK")
    })
    menu.init()
  }
  addClaims(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => (SaveList[state] = true))

    checkHint(states)

    resolve()

    checkMissionEnd()
  }
  addStates(resolve: Resolve): void {
    const { states, text } = this.event

    if (!states) return resolve()

    states.forEach((state) => (SaveList[state] = true))

    if (text) {
      chat.add(db.me.id, text[LocalList.lang!], true)
    }

    checkHint(states)

    resolve()

    checkMissionEnd()
  }
  removeStates(resolve: Resolve): void {
    const { states } = this.event

    if (!states) return resolve()

    states.forEach((state) => delete SaveList[state])

    resolve()

    checkMissionEnd()
  }
  addLocalFlags(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => (SaveList[state] = true))

    checkHint(states)

    resolve()

    checkMissionEnd()
  }
  removeLocalFlags(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => (SaveList[state] = false))

    resolve()

    checkMissionEnd()
  }
  addSetting(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => (LocalList[state] = true))

    localSave.save()

    checkHint(states)

    resolve()
  }
  removeSetting(resolve: Resolve): void {
    const { states } = this.event
    if (!states) return resolve()

    states.forEach((state) => {
      delete LocalList[state]
    })
    localSave.save()
    resolve()
  }
  addHint(resolve: Resolve): void {
    const { text, idx, id, states, instant } = this.event
    if (!this.targetKey || !id || !text || !states) return resolve()

    setHint({
      idx: typeof idx === "number" ? idx : 761,
      id,
      states,
      text,
      instant
    })

    resolve()
  }
  objectives(resolve: Resolve): void {
    const { text } = this.event
    if (!text) {
      objective.destroy()
      return resolve()
    }
    objective.update(text)
    resolve()
  }
  phone(resolve: Resolve): void {
    if (db.pmc || chat.formOpened) return resolve()
    const menu = new Phone({
      game: this.game,
      onComplete: () => {
        resolve()
      }
    })
    menu.init()
  }

  async teleport(resolve: Resolve): Promise<void> {
    const TILE_SIZE = 16
    const { who, direction, x, y } = this.event

    if (!who || !x || !y) return resolve()

    const person = this.game.map.gameObjects[who]
    const mapId = this.game.map.mapId

    MapList[mapId].configObjects[who].x = x
    MapList[mapId].configObjects[who].y = y
    MapList[mapId].configObjects[who].direction = direction

    if (person instanceof Person) {
      person.x = x * TILE_SIZE
      person.y = y * TILE_SIZE
      person.direction = direction || "down"
    } else if (person instanceof Prop || person instanceof Interactable) {
      person.x = x * TILE_SIZE
      person.y = y * TILE_SIZE
    }
    await waittime(500)
    resolve()
  }

  async teleportFromDirection(resolve: Resolve): Promise<void> {
    const { who, teleporter } = this.event
    if (!who || !teleporter) return resolve()

    const player = this.game.map.gameObjects[who]

    if (player instanceof Person && teleporter && teleporter.from) {
      const playerDirection = player.direction
      const destination = teleporter.from[playerDirection]

      if (destination) {
        const TILE_SIZE = 16
        player.x = destination.x * TILE_SIZE
        player.y = destination.y * TILE_SIZE
        player.direction = destination.direction || "down"
      } else {
        // console.warn(`No teleport destination found for direction: ${playerDirection}`)
      }
    } else {
      // console.warn(`Teleport event is missing player or teleporter object.`)
    }

    await waittime(500)
    resolve()
  }

  addItem(resolve: Resolve): void {
    const { id, amount } = this.event
    if (!id || !amount) return
    const item = work.items.find((itm) => itm.id === id)
    if (!item) return resolve()

    db.job.setItem({ id, amount })

    notip({
      ic: "backpack",
      a: item.name[LocalList.lang!],
      b: `+${amount}`
    })

    resolve()
  }
  addNote(resolve: Resolve): void {
    const { pages, name } = this.event
    if (!this.targetKey || !pages || !name) return resolve()

    const item = cloudItem.find((itm) => itm.id === "J00006")
    if (!item) return resolve()

    paperAdd(this.targetKey, pages, name)

    db.job.setItem({ id: this.targetKey, amount: 1, itemId: "J00006" })

    notip({
      ic: "backpack",
      a: name[LocalList.lang!],
      b: `+${1}`
    })
    resolve()
  }
  readnote(resolve: Resolve): void {
    if (!this.targetKey) return resolve()

    const note = paperGet(this.targetKey)
    if (!note) return resolve()

    const paper = new Paper({
      onComplete: () => resolve(),
      name: note.name,
      text: note.text
    })
    paper.init()
  }

  async payout(resolve: Resolve): Promise<void> {
    const events: IObjectEvent[] = work.startend.end || []

    if (!events) return

    if (!this.event.crew) {
      socket.send("payout")
    }

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new GameEvent(this.game, events[i])
      const result = await eventHandler.init()
      if (result === "BREAK") {
        break
      }
    }

    const payout = new Payout({
      onComplete: () => resolve,
      game: this.game
    })
    payout.init()
  }

  async winner(resolve: Resolve): Promise<void> {
    const events = work.startend.end || []
    if (!events) return

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new GameEvent(this.game, events[i])
      const result = await eventHandler.init()
      if (result === "BREAK") {
        break
      }
    }

    const { winners } = this.event
    const won = winners!.find((usr) => usr === db.me.id)

    const payout = new Payout({
      onComplete: () => resolve,
      game: this.game,
      fail: !won
    })
    payout.init()
  }

  async playerLeft(resolve: Resolve): Promise<void> {
    await modal.abort()
    await modal.alert(lang.PRP_ON_LEFT.replace("{user}", this.event.user!.username!))
    const payout = new Payout({ onComplete: () => resolve(), game: this.game, fail: true })
    payout.init()
  }

  settingMenu(resolve: Resolve): void {
    const setting = new Setting({ game: this.game, onComplete: () => resolve() })
    setting.init()
  }

  backsongControl(resolve: Resolve): void {
    if (this.event.action === "pause") {
      // backsong.pause()
      resolve()
      return
    }
    // backsong.resume()
    resolve()
  }
  async playSound(resolve: Resolve): Promise<void> {
    if (!this.event.which) return resolve()
    audio.emit({ action: "play", type: this.event.which, src: this.event.src })
    if (!this.event.instant) await waittime(1000)
    resolve()
  }

  init() {
    return new Promise((resolve: Resolve) => {
      if (!this.event.type) return resolve()

      if (INVALID_CONTROLS.find((control) => control === this.event.type)) return resolve()

      const type = this.event.type as keyof GameEvent
      if (!this[type]) return resolve()

      this[type](resolve)
    })
  }
}
