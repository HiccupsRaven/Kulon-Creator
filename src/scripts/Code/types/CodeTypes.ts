export type ModScriptLanguage = "typescript" | "javascript"
export type ModStyleLanguage = "scss" | "css"
export type ModLanguage = ModScriptLanguage | ModStyleLanguage | "json"

export interface IModLanguage {
  script: ModScriptLanguage
  style: ModStyleLanguage
  lastCompiled?: number
  lastSaved?: number
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

export interface UGMRefExtended extends UGMRef {
  assets?: string
}
