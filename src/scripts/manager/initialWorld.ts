import { IAssets } from "../types/LibTypes"
import { IMapList } from "../types/MapsTypes"

interface InitialWorld {
  maps: IMapList | null
  assets: IAssets | null
}

const initialWorld: InitialWorld = {
  maps: null,
  assets: null
}

export function setOfflineMaps(maps: IMapList): void {
  initialWorld.maps = maps
}

export function getOfflineMaps(): IMapList {
  return initialWorld.maps!
}

export function setOfflineAssets(assets: IAssets): void {
  initialWorld.assets = assets
}

export function getOfflineAssets(): IAssets {
  return initialWorld.assets!
}
