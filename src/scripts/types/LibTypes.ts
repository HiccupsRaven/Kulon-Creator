export type SSKelement = HTMLElementTagNameMap[keyof HTMLElementTagNameMap]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IAny = any

export type IReqType = "POST" | "GET"

export interface IRepB {
  ok: boolean
  code: number
  msg: string
  data?: IAny
  errors?: IAny
}

export interface ILocale {
  id: string
  en: string
}

export interface KelementAttr {
  c?: string
  class?: string
  "."?: string
  id?: string
  "#"?: string
  a?: {
    [key: string]: string | number | boolean
  }
  attr?: {
    [key: string]: string | number | boolean
  }
  child?: SSKelement | string | (SSKelement | string)[]
  e?: SSKelement | string | (SSKelement | string)[]
}
export interface ILocale {
  id: string
  en: string
}

export type AssetType = "map" | "object" | "audio"

export interface IAsset {
  id: string
  name: string
  path: string
  type: AssetType
  vfs?: string
}

export type IAssets = IAsset[]

export interface IAssetContent {
  id: string
  content: string
  type?: "image" | "audio"
}
