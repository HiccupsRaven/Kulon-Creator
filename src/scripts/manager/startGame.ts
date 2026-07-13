import { toObject } from "../Creator/lib/gen"
import { UGCProject, UGCRef } from "../Creator/types/CreatorTypes"
import db from "../data/db"
import { addToGlobalUrl } from "../lib/globalURL"
import { futor, kel } from "../lib/kel"
import LoadAssets from "../lib/LoadAssets"
import { IMapList } from "../types/MapsTypes"
import chat from "./Chat"
import { setOfflineAssets, setOfflineMaps } from "./initialWorld"
import { loadModScript, loadModStyle, setModScript } from "./modLoader"
import setNewGame from "./setNewGame"
import { work } from "./WorkWorld"

export function startGame(nextWork: UGCRef, isFirst: boolean = false): void {
  const id = Date.now().toString()
  db.me = {
    access: [1, 2, 3, 4, 5, 6, 7],
    id,
    joined: Date.now(),
    skin: { Outfits: "hero" },
    trophies: [],
    username: `TestUser${id}`
  }

  chat.run()

  const canvas = kel("canvas", "game-canvas", { id: "game-canvas" })
  const container = futor(".app")
  container.prepend(canvas)

  setNewGame(nextWork, null, isFirst)
}

export async function setTestWorld(data: UGCProject): Promise<void> {
  work.maps = toObject(data.maps)
  work.items = toObject(data.items)
  work.startend = toObject(data.startend)
  work.settings = toObject(data.settings)

  const sanitizeAssets = await addToGlobalUrl(data.meta.id, toObject(data.assets))
  work.assets = toObject(sanitizeAssets)

  setOfflineAssets(work.assets)
  await new LoadAssets({ files: work.assets }).run()

  setOfflineMaps(work.maps as IMapList)

  if (data.mods && data.mods.script && data.mods.style) {
    setModScript(data.mods.script)
    loadModStyle(data.mods.style)

    const { CustomGame } = await loadModScript()

    db.pmx = CustomGame
  }
}
