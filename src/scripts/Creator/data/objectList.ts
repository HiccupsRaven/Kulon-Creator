import { IGameObjectData } from "../types/CreatorTypes"
import { getHero } from "./systemObjects"
import { work } from "./work"

interface IObjectReturn {
  map: string
  object: IGameObjectData
}

export class ObjectList {
  find(objId: string): IObjectReturn | undefined {
    if (objId === "hero") return { map: "kulon", object: getHero() }

    const map = Object.keys(work).find((k) => work[k].configObjects[objId])

    if (!map) return undefined

    const obj = work[map].configObjects[objId]

    if (!obj) return undefined

    return {
      map: work[map].id,
      object: obj
    }
  }
  findByMap(objId: string, mapId: string): IObjectReturn | undefined {
    const obj = work[mapId].configObjects[objId]

    if (!obj) return undefined

    return {
      map: mapId,
      object: obj
    }
  }
}

export const objectList = new ObjectList()
