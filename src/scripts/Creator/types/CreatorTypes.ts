import { IAsset, SSKelement } from "../../types/LibTypes"
import { NewEvent } from "../Editor/Forms/NewEvent"

export interface ILocale {
  id: string
  en: string
}

export type GameObjectType = "Person" | "Interactable" | "Teleporter" | "Player" | "Prop"
export type GameObjectSrc = string[] | string

export type DirectionType = "up" | "down" | "left" | "right"

interface IPos {
  x: number
  u: number
}

export interface IChoiceOption {
  text: ILocale
  pass?: boolean
}

export interface IWalk {
  who?: string
  direction?: DirectionType
}

export interface IObjectEvent {
  n: string
  type: string
  who?: string
  x?: number
  y?: number
  map?: string
  direction?: DirectionType
  walk?: IWalk[]
  time?: number
  door?: boolean
  idx?: number
  name?: ILocale
  text?: ILocale
  pages?: ILocale[]
  options?: IChoiceOption[]
  noCancel?: boolean
  states?: string[]
  from?: {
    up?: IPos
    down?: IPos
    left?: IPos
    right?: IPos
  }
  id?: string
  amount?: number
  first?: boolean
  crew?: boolean
  action?: string
  src?: string
  which?: string
  instant?: boolean
  winners?: string[]
}
export interface IObjectTalk {
  required?: string[]
  events: IObjectEvent[]
}

export interface TeleporeterFromPosition {
  x: number
  y: number
  direction?: DirectionType
}
export interface IGameObjectTeleporterType {
  up?: TeleporeterFromPosition
  down?: TeleporeterFromPosition
  left?: TeleporeterFromPosition
  right?: TeleporeterFromPosition
}

export interface IGameObjectData {
  id?: string
  name?: string
  finished?: IObjectEvent[]
  type: GameObjectType
  x: number
  y: number
  src?: GameObjectSrc
  shadow?: boolean
  talk?: IObjectTalk[]
  drops?: IObjectTalk[]
  health?: number
  offset?: number[]
  collision?: number[]
  states?: string[]
  floor?: boolean
  from?: IGameObjectTeleporterType
  direction?: DirectionType
  isRemote?: boolean
  canControlled?: boolean
  enemy?: boolean
  following?: boolean
}
export type IGameObjects = Record<string, IGameObjectData>

export interface IWalls {
  [key: string]: boolean
}
export interface ICutscenes {
  [key: string]: IObjectTalk[]
}

export interface ISafeZone {
  x: number
  y: number
}

export interface IMapConfig {
  id: string
  name: string
  lowerSrc: string
  upperSrc: string
  ambience?: string
  footstep?: "a" | "b"
  useWeather?: boolean
  configObjects: IGameObjects
  walls: IWalls
  cutscenes: ICutscenes
  safeZone?: ISafeZone
  bulk?: ISafeZone[]
}

export type IMapList = Record<string, IMapConfig>

export interface ICloudItem {
  id: string
  name: {
    id: string
    en: string
  }
  desc: {
    id: string
    en: string
  }
  src: string
  group: "0" | "1" | "2"
}

export interface UGCMeta {
  id: string
  created: number
  modified: number
  files: number
}

export interface IStartEnd {
  start?: IObjectEvent[]
  end?: IObjectEvent[]
}

export type ITileAction = "record" | "free" | "wall" | "bulk" | "cutscene" | "object" | "teleporter"

export type IEventForms = Record<string, (form: NewEvent, s?: IObjectEvent) => string | SSKelement>

export interface IEventType {
  id: keyof IEventForms
  ic: string
  name: string
  desc: string
  keyOnly?: boolean
  disabled?: boolean
}

export type IEventTypes = IEventType[]

export type ProjectResponse = {
  errors: string[]
  pass: boolean
}

export enum WorldGameMode {
  COOP = 1,
  VERSUS = 2
}

export enum WorldGameReady {
  RELEASE = 1,
  BETA = 2
}

export enum WorldType {
  MISSION = 1,
  FREEROAM = 2
}

export interface IWorldSpawnRule {
  map?: string
  x?: number
  y?: number
  direction?: DirectionType
}

export interface IGameSettings {
  project: string
  name?: ILocale
  desc?: ILocale
  type?: WorldType
  mode?: WorldGameMode
  allowCombat?: boolean
  ready?: WorldGameReady
  min?: number
  max?: number
  spawn?: IWorldSpawnRule[]
  price?: number
  payout?: [number, number]
  reqs?: string[]
}

export interface IUGCMods {
  script?: string
  style?: string
}

export interface UGCRef {
  maps: IMapList
  assets: IAsset[]
  startend: IStartEnd
  meta: UGCMeta
  items: ICloudItem[]
  settings: IGameSettings
}

export interface UGCProject extends UGCRef {
  mods?: IUGCMods
}

export type UGCData = Record<string, UGCRef>
