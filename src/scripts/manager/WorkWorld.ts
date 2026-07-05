import { IAssets } from "../types/LibTypes"
import { ICloudItem, IGameSettings, IMapList, IStartEnd, UGCMeta, UGCRef } from "../Creator/types/CreatorTypes"
import SaveList from "../data/SaveList"
import socketHandler from "../lib/OSocketHandler"

const maps: IMapList = {}
const assets: IAssets = []
const items: ICloudItem[] = []
const startend: IStartEnd = {}
const settings: IGameSettings = { project: "noname" }
const meta: UGCMeta = { created: 0, modified: 0, id: "noid", files: 0 }

export const work: UGCRef = {
  maps,
  assets,
  items,
  startend,
  settings,
  meta
}

export function checkMissionEnd(): void {
  const reqs = work.settings.reqs!

  const isFinished = reqs.every((state) => SaveList[state] === true)

  if (isFinished) socketHandler.payout()
}
