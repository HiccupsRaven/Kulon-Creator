import { UGCRef } from "../Creator/types/CreatorTypes"
import MapList from "../data/MapList"
import { futor } from "../lib/kel"
import { Game } from "../main/Game"
import SetNextMap from "./SetNextMap"
import localSave from "./storage"

export default async function setNewGame(nextWork: UGCRef, gameInstance: Game | null = null, _isfirst: boolean = false): Promise<Game> {
  gameInstance?.destroy()

  const nextMap = nextWork.maps

  SetNextMap(nextMap, nextWork.settings)

  const firstMapId = Object.keys(MapList)[0]
  localSave.mapId = firstMapId

  const canvasSize = 344

  const canvas = futor("#game-canvas") as HTMLCanvasElement
  const game = new Game(canvas, canvasSize)
  await game.init()
  return game
}
