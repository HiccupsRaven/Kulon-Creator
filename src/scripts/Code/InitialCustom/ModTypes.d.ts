declare module "*.scss"
declare module "*.styl"
declare module "*.css"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare type IAny = any

declare interface KulonAsset {
  [key: string]: {
    src: string
  }
}

declare interface IKulonAudioOptions {
  fadeIn?: number
  fadeOut?: number
  id?: string
  volume?: number
  loop?: boolean
  lossVol?: number
}

declare interface IKulonAudioConfig {
  action: "play" | "stop"
  type: "bgm" | "ui" | "sfx" | "footstep" | "peerfootstep" | "ambient"
  id?: string
  src?: string
  options?: IKulonAudioOptions
}

declare interface KulonAudio {
  emit(event: IKulonAudioConfig): void

  stopAll(): void
}

declare interface IKulonLocale {
  id: string
  en: string
}

declare type KulonAnyMessageType = string | boolean | number | null

declare type KulonAnyMessage = Record<string, KulonAnyMessageType>

declare type KulonDirectionType = "up" | "down" | "left" | "right"

declare interface IKulonWalk {
  who?: string
  direction?: KulonDirectionType
}

declare interface IKulonChoiceOption {
  text: IKulonLocale
  pass?: boolean
}

declare interface IKulonPos {
  x: number
  u: number
}

declare type KulonGameObjectType = "Person" | "Interactable" | "Teleporter" | "Player" | "Prop"

declare type KulonGameObjectSrc = string[] | string

declare interface IKulonObjectEvent {
  n?: string
  type: string
  who?: string
  x?: number
  y?: number
  map?: string
  direction?: KulonDirectionType
  walk?: IKulonWalk[]
  time?: number
  door?: boolean
  idx?: number
  name?: IKulonLocale
  text?: IKulonLocale
  pages?: IKulonLocale[]
  options?: IKulonChoiceOption[]
  noCancel?: boolean
  states?: string[]
  from?: {
    up?: IKulonPos
    down?: IKulonPos
    left?: IKulonPos
    right?: IKulonPos
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

declare interface IKulonObjectTalk {
  required?: string[]
  events: IKulonObjectEvent[]
}

declare interface IKulonTeleporeterFromPosition {
  x: number
  y: number
  direction?: KulonDirectionType
}
declare interface IKulonGameObjectTeleporterType {
  up?: IKulonTeleporeterFromPosition
  down?: IKulonTeleporeterFromPosition
  left?: IKulonTeleporeterFromPosition
  right?: IKulonTeleporeterFromPosition
}

declare interface IKulonGameObjectData {
  name?: string
  id?: string
  finished?: IKulonObjectEvent[]
  type: KulonGameObjectType
  x: number
  y: number
  src?: KulonGameObjectSrc
  shadow?: boolean
  talk?: IKulonObjectTalk[]
  drops?: IKulonObjectTalk[]
  health?: number
  offset?: number[]
  collision?: number[]
  states?: string[]
  floor?: boolean
  from?: IKulonGameObjectTeleporterType
  direction?: KulonDirectionType
  isRemote?: boolean
  canControlled?: boolean
  enemy?: boolean
  following?: boolean
}

declare interface KulonGame {
  readonly isPaused: boolean
  readonly isCutscenePlaying: boolean

  addGameObject(gameObject: IKulonGameObjectData): void
}

declare interface IKulonSkin {
  Bodies: string
  Eyes: string
  Outfits: string
  Backpacks: string
  Beards: string
  Glasses: string
  Hairstyles: string
  Hats: string
}

declare interface IKulonUser {
  id: string
  username: string
  joined: number
  trophies: string[]
  skin: Partial<IKulonSkin>
  access: number[]
}

declare interface KulonCharacterAPI {
  readonly user: IKulonUser

  readonly id: string

  readonly mapId: string

  readonly x: number

  readonly y: number

  readonly direction: KulonDirectionType

  get skin(): IKulonSkin

  setMapId(newMapId: string): void

  setX(newX: number): void

  setY(newY: number): void

  setCustomCoor(coor: "x" | "y", newCoor: number): void

  setDirection(newDirection: KulonDirectionType): void

  send(message: { [key: string]: string | boolean | number | null }): void
}

declare interface IKulonPlayersMatchMaking {
  id: string
  ts: number
  ready: boolean
  done: boolean
}

declare interface KulonJobFlag {
  val(): string | boolean | undefined
  set(): void
  delete(): void
}

declare type IKulonJobStates = {
  [key: string]: boolean | string
}

declare interface IKulonJobItem {
  id: string
  amount: number
  itemId?: string
}

declare type KulonJobBag = Record<string, IKulonJobItem>

declare interface KulonJob {
  get host(): string | undefined

  get id(): string | undefined

  set status(newStatus: number)

  get status(): number | undefined

  flag(flagId: string): KulonJobFlag

  get users(): IKulonUser[] | undefined

  getUser(userId: string): IKulonUser | undefined

  playerExists(userId: string): boolean

  get players(): IKulonPlayersMatchMaking[] | undefined

  get bag(): KulonJobBag | undefined

  setItem(item: IKulonJobItem): void

  getItem(item: string): IKulonJobItem | undefined
}

declare interface KulonPeers {
  size(): number

  getAll(): Map<string, KulonCharacterAPI>

  get arr(): KulonCharacterAPI[]

  has(userId: string): boolean

  get(user: IKulonUser | string): KulonCharacterAPI | undefined

  sendOne(userId: string, type: string, message: KulonAnyMessage): void

  send(type: string, message: KulonAnyMessage): void
}

declare interface KulonSocket {
  send(type: string, message: KulonAnyMessage): void
}

declare interface IKulonModConfig {
  peers: KulonPeers
  socket: KulonSocket
  job: KulonJob
  asset: KulonAsset
  audio: KulonAudio
  me: string
}

declare interface KulonMod {
  readonly id: string
  config?: IKulonModConfig
  addClaim?(state: string, status: boolean | string): void
  onInteract?(x: number, y: number, isRemote?: boolean, data?: IAny): void
  destroy(): void | Promise<void>
  setGame(game: KulonGame): void
  init(...args: IAny): void
}
