import { toObject } from "../lib/gen"
import { IMapList } from "../types/CreatorTypes"

export let work: IMapList = {}

export function setWorkSpace(config: IMapList): void {
  work = toObject(config)
}

export function resetWorkSpace(): void {
  // Object.keys(work).forEach((k) => delete work[k])
  work = toObject({})
}
