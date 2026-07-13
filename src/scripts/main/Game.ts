import cloud_items from "../../../public/json/items/cloud_items.json"
import { InputHandler } from "./InputHandler"
import { Camera } from "./Camera"
import MapList from "../data/MapList"
import SaveList from "../data/SaveList"
import { GameEvent } from "./GameEvent"
import { KeyPressListener } from "./KeyPressListener"
import { GameMap } from "./GameMap"
import db from "../data/db"
import chat from "../manager/Chat"
import KulonUI from "../manager/KulonUI"
import KulonPad from "./KulonPad"
import { Prop } from "./Prop"
import { Player } from "./Player"
import { IGameObjectData, IObjectEvent, IObjectTalk } from "../types/MapsTypes"
import { WeatherControl } from "../Weather/WeatherControl"
import socket from "../lib/OSocket"
import { work } from "../manager/WorkWorld"
import socketHandler from "../lib/OSocketHandler"
import cloudItem from "../data/cloudItems"

export interface GameObjectMain {
  update: (deltaTime: number, keys: InputHandler["keys"], walls: GameMap["walls"], game: Game) => void
}

export class Game {
  private ctx: CanvasRenderingContext2D
  map!: GameMap

  inputHandler: InputHandler = new InputHandler()
  kulonPad: KulonPad = new KulonPad(150)

  player!: Player
  camera!: Camera

  isPaused: boolean = false
  isCutscenePlaying: boolean = false
  lastTriggeredCutsceneKey: string | null = null

  wasMoving: boolean = false
  lastMoveTime: number = 0

  keyListeners: KeyPressListener[] = []
  kulonUI: KulonUI = new KulonUI()

  lastTime: number = 0
  animationFrameId: number | null = null
  private boundResizeCanvas: () => void

  weatherControl: WeatherControl = new WeatherControl()

  constructor(
    public canvas: HTMLCanvasElement,
    public VIEWPORT_WIDTH: number
  ) {
    this.canvas = canvas
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D
    this.ctx.imageSmoothingEnabled = false

    this.boundResizeCanvas = this.resizeCanvas.bind(this)
    window.addEventListener("resize", this.boundResizeCanvas)
  }

  private keypressAction(): void {
    this.keyListeners.push(
      new KeyPressListener("escape", () => this.openPhone()),
      new KeyPressListener("t", () => chat.open()),
      new KeyPressListener("e", this.checkForInteraction.bind(this)),
      new KeyPressListener("k", () => {
        if (!this.isPaused && !this.isCutscenePlaying) {
          this.player.attack()
        }
      })
    )

    this.kulonUI.phone.onClick(() => this.openPhone())
    this.kulonUI.chat.onClick(() => chat.open())
    this.kulonUI.gamepad.onClick(() => this.kulonPad.toggle())

    this.kulonPad.setOnMove((direction) => this.inputHandler.movePad(direction))
    this.kulonPad.setOnRelease((direction) => this.inputHandler.releasePad(direction))
    this.kulonPad.setOnInteract(this.checkForInteraction.bind(this))
    this.kulonPad.setOnAttact(() => {
      if (!this.isPaused && !this.isCutscenePlaying) {
        this.player.attack()
      }
    })
  }

  pause(): void {
    this.isPaused = true
  }

  resume(): void {
    this.isPaused = false
  }

  private openPhone(): void {
    if (!this.isCutscenePlaying && !db.pmc && !chat.formOpened) {
      this.startCutscene([{ type: "phone" }])
    }
  }

  async startGame(): Promise<void> {
    this.inputHandler.init()

    const mapName = Object.keys(MapList)[0]

    this.map = new GameMap(MapList[mapName])
    await this.map.loadPromise

    this.player = this.map.getPlayer()
    this.camera = new Camera(this.canvas, this.map.bottomImage.width, this.map.bottomImage.height)
    this.resizeCanvas()

    this.weatherControl.init(this)

    this.gameLoop()

    socketHandler.init(this)
    socket.init(this)

    cloudItem.splice(0, cloudItem.length)

    db.job.create({
      bag: {},
      code: 1234,
      host: db.me.id,
      id: "1234",
      invite: 1234,
      itemId: "69",
      mission: work.settings.project!,
      players: [],
      states: {},
      status: 2,
      users: [db.me]
    })

    cloudItem.push(...cloud_items)

    work.items.forEach((k) => {
      cloudItem.push(k)
    })

    console.log(db.pmx)
    console.log(db.pmx?.id)

    if (db.pmx && db.pmx.setGame) {
      console.log(1, true)
      db.pmx.setGame(this)
    }

    this.kulonUI.init()
    this.keypressAction()

    db.onduty = 2

    await this.startCutscene(work.startend.start || [])

    if (db.pmx && db.pmx.init) {
      console.log(2, true)
      db.pmx.init(Date.now())
    }

    // backsong.switch(1)
    // backsong.start(750)
  }

  private resizeCanvas(): void {
    const scale = window.innerWidth / this.VIEWPORT_WIDTH
    this.canvas.style.width = `${window.innerWidth}px`
    const newHeight = Math.floor(window.innerHeight / scale)
    this.canvas.style.height = `${window.innerHeight}px`
    this.canvas.width = this.VIEWPORT_WIDTH
    this.canvas.height = newHeight
    this.ctx.imageSmoothingEnabled = false
  }

  private gameLoop(currentTime = 0): void {
    if (!this.lastTime) {
      this.lastTime = currentTime
    }

    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    if (!this.isPaused) {
      this.update(deltaTime)
    }
    this.draw()

    this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this))
  }

  private update(deltaTime: number): void {
    Object.values(this.map.gameObjects).forEach((obj: GameObjectMain) => {
      obj.update(deltaTime, this.inputHandler.keys, this.map.walls, this)
    })
    this.camera.update(this.player)

    this.weatherControl.update(deltaTime)

    this.checkForCutscene()
  }

  private checkForInteraction(): void {
    if (this.isCutscenePlaying || this.isPaused) {
      return
    }

    const TILE_SIZE = 16
    const { x, y, direction, collisionBox } = this.player

    if (db.pmx && db.pmx.onInteract) db.pmx.onInteract(x, y)

    const interactionBox = {
      x: x + collisionBox.xOffset,
      y: y + collisionBox.yOffset,
      width: collisionBox.width,
      height: collisionBox.height
    }

    if (direction === "up") interactionBox.y -= TILE_SIZE / 2
    else if (direction === "down") interactionBox.y += TILE_SIZE / 2
    else if (direction === "left") interactionBox.x -= TILE_SIZE / 2
    else if (direction === "right") interactionBox.x += TILE_SIZE / 2

    const gameObjects = this.map.gameObjects

    const targetKey = Object.keys(gameObjects).find((key) => {
      const obj = gameObjects[key]
      if (obj === this.player || !obj.collisionBox) return false

      const objBox = {
        x: obj.x,
        y: obj.y,
        width: obj.collisionBox.width,
        height: obj.collisionBox.height
      }

      return interactionBox.x < objBox.x + objBox.width && interactionBox.x + interactionBox.width > objBox.x && interactionBox.y < objBox.y + objBox.height && interactionBox.y + interactionBox.height > objBox.y
    })

    const target = targetKey ? gameObjects[targetKey] : null

    if (target && target.talk && target instanceof Prop === false) {
      if (typeof target.facePlayer === "function") {
        target.facePlayer(this.player.direction)
      }
      this.findAndStartScenario(target.talk, targetKey)
    }
  }

  private draw(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    if (!this.map || !this.map.isLoaded) {
      return
    }

    this.ctx.save()
    this.camera.apply(this.ctx)
    this.map.drawBottomImage(this.ctx)

    const sortedGameObjects = Object.values(this.map.gameObjects).sort((a, b) => {
      const aIsFloorProp = a instanceof Prop && a.floor
      const bIsFloorProp = b instanceof Prop && b.floor

      if (aIsFloorProp && !bIsFloorProp) {
        return -1
      }
      if (!aIsFloorProp && bIsFloorProp) {
        return 1
      }
      return a.y - b.y
    })
    sortedGameObjects.forEach((obj) => obj.draw(this.ctx))

    this.map.drawTopImage(this.ctx)
    this.weatherControl.draw(this.ctx)
    this.ctx.restore()
  }

  private checkForCutscene(): void {
    if (this.isCutscenePlaying) {
      return
    }

    const TILE_SIZE = 16
    const playerFeetGridX = Math.floor((this.player.x + this.player.collisionBox.xOffset + this.player.collisionBox.width / 2) / TILE_SIZE)
    const playerFeetGridY = Math.floor((this.player.y + this.player.collisionBox.yOffset + this.player.collisionBox.height / 2) / TILE_SIZE)

    const key = `${playerFeetGridX},${playerFeetGridY}`

    const cutsceneTrigger = this.map.cutscenes && this.map.cutscenes[key]
    if (cutsceneTrigger && this.lastTriggeredCutsceneKey !== key) {
      this.lastTriggeredCutsceneKey = key
      this.findAndStartScenario(cutsceneTrigger, key)
      return
    }

    const gameObjects = this.map.gameObjects

    const propTriggerKey = Object.keys(gameObjects).find((k) => {
      const obj = gameObjects[k]
      if (obj instanceof Prop) {
        const propGridX = Math.floor(obj.x / TILE_SIZE)
        const propGridY = Math.floor(obj.y / TILE_SIZE)
        return propGridX === playerFeetGridX && propGridY === playerFeetGridY && obj.talk
      }
      return false
    })

    const propTrigger = (propTriggerKey ? gameObjects[propTriggerKey] : null) as Prop | null

    if (propTrigger && this.lastTriggeredCutsceneKey !== `prop_${propTrigger.x},${propTrigger.y}`) {
      this.lastTriggeredCutsceneKey = `prop_${propTrigger.x},${propTrigger.y}`
      this.findAndStartScenario(propTrigger.talk, propTriggerKey)
      return
    }

    if (!cutsceneTrigger && !propTrigger) {
      this.lastTriggeredCutsceneKey = null
    }
  }

  findAndStartScenario(scenarios: IObjectTalk[], targetKey?: string): void {
    for (let i = 0; i < scenarios.length; i++) {
      const reqMet = (scenarios[i].required || []).every((state) => {
        return SaveList[state]
      })

      if (reqMet) {
        this.startCutscene(scenarios[i].events, i, targetKey)
        break
      }
    }
  }
  forceCutscene(newBool: boolean): void {
    this.isCutscenePlaying = newBool
  }
  async startCutscene(events: IObjectEvent[], targetIdx?: number, targetKey?: string): Promise<void> {
    this.isCutscenePlaying = true
    this.kulonUI.hide()
    this.kulonPad.hide()

    this.player.isMoving = false

    for (let i = 0; i < events.length; i++) {
      const eventHandler = new GameEvent(this, events[i], targetIdx, targetKey)
      const result = await eventHandler.init()
      if (result === "BREAK") {
        break
      }
    }
    this.kulonUI.show()
    this.kulonPad.show()
    this.isCutscenePlaying = false
  }
  addGameObject(configObject: IGameObjectData): void {
    this.map.addGameObject(configObject)
  }
  destroy(): void {
    window.removeEventListener("resize", this.boundResizeCanvas)
    this.inputHandler.destroy()
    this.kulonPad.destroy()
    this.kulonUI.destroy()
    this.keyListeners.forEach((listener) => listener.unbind())
    this.keyListeners = []

    if (typeof this.animationFrameId === "number") {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.map) {
      const oldGameObjects = this.map.gameObjects
      const oldWalls = this.map.walls
      Object.keys(oldGameObjects).forEach((k) => delete this.map.gameObjects[k])
      Object.keys(oldWalls).forEach((k) => delete this.map.walls[k])
    }
  }
  async init(): Promise<void> {
    await this.startGame()
  }
}
