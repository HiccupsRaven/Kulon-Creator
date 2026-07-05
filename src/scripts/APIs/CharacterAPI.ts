import { ISkin, IUser } from "../types/DBTypes"
import { DirectionType } from "../types/MapsTypes"

interface IConfig {
  user: IUser
  mapId: string
  x: number
  y: number
  direction: DirectionType
}

export class CharacterAPI {
  user: IUser
  id: string
  mapId: string
  x: number
  y: number
  direction: DirectionType
  constructor(config: IConfig) {
    this.user = config.user
    this.id = `crew_${config.user.id}`
    this.mapId = config.mapId
    this.x = config.x
    this.y = config.y
    this.direction = config.direction
  }
  get skin(): ISkin {
    return this.user.skin as ISkin
  }
  setMapId(newMapId: string): void {
    this.mapId = newMapId
  }
  setX(newX: number): void {
    this.x = newX
  }
  setY(newY: number): void {
    this.y = newY
  }
  setCustomCoor(coor: "x" | "y", newCoor: number): void {
    if (!["x", "y"].find((oldCoor) => oldCoor === coor)) return
    this[coor] = newCoor
  }
  setDirection(newDirection: DirectionType) {
    this.direction = newDirection
  }
  send(_msg: { [key: string]: string | boolean | number | null }): void {
    // this.remote.send(msg)
  }
}
