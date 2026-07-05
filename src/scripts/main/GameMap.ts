import asset from "../data/assets"
import { Person } from "./Person"
import { Player } from "./Player"
import { Interactable } from "./Interactable"
import { Teleporter } from "./Teleporter"
import audio from "../lib/AudioHandler"
import { Prop } from "./Prop"
import { ICutscenes, IGameObjectData, IGameObjectInteractable, IGameObjectPerson, IGameObjects, IGameObjectTeleporter, IMapConfig, IWalls, MapGameObjects, MapWalls } from "../types/MapsTypes"
import MapList from "../data/MapList"
import db from "../data/db"

type Resolve = (val?: string) => void

const TILE_SIZE = 16

export class GameMap {
  gameObjects: MapGameObjects = {}
  walls: MapWalls = {}
  cutscenes: ICutscenes
  mapId: string
  sound?: string
  footstep: "a" | "b"
  useWeather?: boolean

  bottomImage: HTMLImageElement = new Image()
  topImage: HTMLImageElement = new Image()
  isLoaded: boolean = false

  loadPromise: Promise<unknown>
  constructor(config: IMapConfig) {
    this.cutscenes = config.cutscenes || {}
    this.mapId = config.id
    this.sound = config.ambience
    this.footstep = config.footstep || "a"
    this.useWeather = config.useWeather || false

    this.bottomImage.src = asset[config.lowerSrc].src

    this.topImage.src = asset[config.upperSrc].src

    this.isLoaded = false
    this.loadPromise = new Promise((resolve: Resolve) => {
      const bottomPromise = new Promise((res) => {
        this.bottomImage.onload = res
        this.bottomImage.onerror = res
      })
      const topPromise = new Promise((res) => {
        this.topImage.onload = res
        this.topImage.onerror = res
      })

      Promise.all([bottomPromise, topPromise]).then(() => {
        this.isLoaded = true
        resolve()
      })
    })

    this.mountWalls(config.walls)
    this.mountGameObjects(config.configObjects)
    this.mountRemotePlayers()
    this.playSound()
  }

  getHostId(): string {
    return ""
  }

  isHost(): boolean {
    if (!db.me) return false
    return this.getHostId() === db.me.id
  }

  playSound(): void {
    audio.emit({
      action: "play",
      type: "ambient",
      src: this.sound,
      options: { fadeIn: 1000, fadeOut: 1000 }
    })
  }

  drawBottomImage(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) {
      ctx.drawImage(this.bottomImage, 0, 0)
    }
  }

  drawTopImage(ctx: CanvasRenderingContext2D): void {
    if (this.isLoaded) {
      ctx.drawImage(this.topImage, 0, 0)
    }
  }

  mountWalls(wallsConfig: IWalls): void {
    if (wallsConfig) {
      for (const key in wallsConfig) {
        const [gridX, gridY] = key.split(",").map(Number)
        this.walls[key] = { x: gridX * TILE_SIZE, y: gridY * TILE_SIZE }
      }
    }
  }

  mountGameObjects(configObjects: IGameObjects): void {
    Object.keys(configObjects).forEach((key) => {
      const objectConfig = configObjects[key]

      let gameObject
      if (objectConfig.type === "Person") {
        const pixelConfig = {
          ...objectConfig,
          id: key,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        if ((pixelConfig as IGameObjectPerson).canControlled) {
          gameObject = new Player(pixelConfig as IGameObjectPerson, this.footstep)
        } else {
          gameObject = new Person(pixelConfig as IGameObjectPerson, this.footstep)
        }
      } else if (objectConfig.type === "Interactable") {
        const pixelConfig = {
          ...objectConfig,
          id: key,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Interactable(pixelConfig as IGameObjectInteractable)
      } else if (objectConfig.type === "Prop") {
        const pixelConfig = {
          ...objectConfig,
          id: key,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Prop(pixelConfig as IGameObjectInteractable)
      } else if (objectConfig.type === "Teleporter") {
        const pixelConfig = {
          ...objectConfig,
          id: key,
          x: objectConfig.x * TILE_SIZE,
          y: objectConfig.y * TILE_SIZE
        }

        gameObject = new Teleporter(pixelConfig as IGameObjectTeleporter)
      }

      if (gameObject) {
        this.gameObjects[key] = gameObject
      }
    })
  }

  mountRemotePlayers(): void {
    if (this.mapId === "kulonSafeHouse") return
  }

  unmountRemotePlayer(userId: string): void {
    const playerKey = `crew_${userId}`
    if (this.gameObjects[playerKey]) {
      delete this.gameObjects[playerKey]
    }
  }

  addGameObject(...args: IGameObjectData[]): void {
    const configObjects: IGameObjects = {}

    args.forEach((configObject) => {
      configObjects[configObject.id!] = configObject
      MapList[this.mapId].configObjects[configObject.id!] = configObject
    })

    this.mountGameObjects(configObjects)
  }

  getPlayer() {
    return Object.values(this.gameObjects).find((obj) => obj instanceof Player) as Player
  }

  broadcastAllNpcs(_targetUserId: string): void {}
}
