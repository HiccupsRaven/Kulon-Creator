// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IAny = any

export interface IKulonLocale {
  id: string
  en: string
}

export type KulonAnyMessageType = string | boolean | number | null

export type KulonAnyMessage = Record<string, KulonAnyMessageType>

export type KulonDirectionType = "up" | "down" | "left" | "right"

export interface IKulonWalk {
  who?: string
  direction?: KulonDirectionType
}

export interface IKulonChoiceOption {
  text: IKulonLocale
  pass?: boolean
}

export interface IKulonPos {
  x: number
  u: number
}

export type KulonGameObjectType = "Person" | "Interactable" | "Teleporter" | "Player" | "Prop"

export type KulonGameObjectSrc = string[] | string

export interface IKulonObjectEvent {
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

export interface IKulonObjectTalk {
  required?: string[]
  events: IKulonObjectEvent[]
}

export interface IKulonTeleporeterFromPosition {
  x: number
  y: number
  direction?: KulonDirectionType
}
export interface IKulonGameObjectTeleporterType {
  up?: IKulonTeleporeterFromPosition
  down?: IKulonTeleporeterFromPosition
  left?: IKulonTeleporeterFromPosition
  right?: IKulonTeleporeterFromPosition
}

export interface IKulonGameObjectData {
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

export interface KulonGame {
  readonly isPaused: boolean
  readonly isCutscenePlaying: boolean

  addGameObject(gameObject: IKulonGameObjectData): void
}

export interface IKulonSkin {
  Bodies: string
  Eyes: string
  Outfits: string
  Backpacks: string
  Beards: string
  Glasses: string
  Hairstyles: string
  Hats: string
}

export interface IKulonUser {
  id: string
  username: string
  joined: number
  trophies: string[]
  skin: Partial<IKulonSkin>
  access: number[]
}

export interface KulonCharacterAPI {
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

export interface IKulonPlayersMatchMaking {
  id: string
  ts: number
  ready: boolean
  done: boolean
}

export interface KulonJobFlag {
  val(): string | boolean | undefined
  set(): void
  delete(): void
}

export type IKulonJobStates = {
  [key: string]: boolean | string
}

export interface IKulonJobItem {
  id: string
  amount: number
  itemId?: string
}

export type KulonJobBag = Record<string, IKulonJobItem>

export interface KulonJob {
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

export interface KulonPeers {
  size(): number

  getAll(): Map<string, KulonCharacterAPI>

  get arr(): KulonCharacterAPI[]

  has(userId: string): boolean

  get(user: IKulonUser | string): KulonCharacterAPI | undefined

  sendOne(userId: string, type: string, message: KulonAnyMessage): void

  send(type: string, message: KulonAnyMessage): void
}

export interface KulonSocket {
  send(type: string, message: KulonAnyMessage): void
}

export interface IKulonModConfig {
  peers: KulonPeers
  socket: KulonSocket
  job: KulonJob
  me: string
}

export interface KulonMod {
  readonly id: string
  config?: IKulonModConfig
  addClaim?(state: string, status: boolean | string): void
  onInteract?(x: number, y: number, isRemote?: boolean, data?: IAny): void
  destroy(): void | Promise<void>
  setGame?(game: KulonGame): void
  init(...args: IAny): void
}
