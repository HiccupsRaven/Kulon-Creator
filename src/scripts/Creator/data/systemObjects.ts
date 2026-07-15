import { toObject } from "../lib/gen"
import { IGameObjectData } from "../types/CreatorTypes"

const hero: IGameObjectData = {
  type: "Person",
  x: -100,
  y: -100,
  direction: "down",
  id: "hero",
  name: "Hero (Player)",
  src: "hero"
}

export function getHero(): IGameObjectData {
  return toObject(hero)
}
