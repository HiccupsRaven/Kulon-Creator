export type ModScriptLanguage = "typescript" | "javascript"
export type ModStyleLanguage = "scss" | "less" | "css"
export type ModLanguage = ModScriptLanguage | ModStyleLanguage

export interface IModLanguage {
  script: ModScriptLanguage
  style: ModStyleLanguage
}

export interface UGMTree {
  id: string
  project: string
  created: number
  modified: number
  modLanguage?: IModLanguage
}

export interface UGMRef {
  script?: string
  style?: string
}
