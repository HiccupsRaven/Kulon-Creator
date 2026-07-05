import { IAssets } from "../../types/LibTypes"
import { ICloudItem, IGameSettings, IMapList, IStartEnd, UGCMeta } from "../types/CreatorTypes"

const maps: IMapList = {}
const assets: IAssets = []
const items: ICloudItem[] = []
const startend: IStartEnd = {}
const settings: IGameSettings = { project: "noname" }
const meta: UGCMeta = { created: 0, modified: 0, id: "noid", files: 0 }

export const db = {
  maps,
  assets,
  items,
  startend,
  settings,
  meta
}
