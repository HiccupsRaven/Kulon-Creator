import { AssetType, IAny, IAsset, IAssets } from "./LibTypes"
export type FileDataType = "audio" | "image" | "json" | "script" | "style" | "type_definition"

export interface FileMetadata {
  path: string
  projectId: string
  folder: string
  fileName: string
  type: FileDataType
  updatedAt: number
}

export interface FileContent {
  path: string
  content: Blob | string | Record<string, IAny>
}

export interface IAddedReplaceFile {
  id: string
  name: string
  file?: File
  type: AssetType
}

export interface IReplaceFile {
  id: string
  name: string
  type: AssetType
  file?: File
}

export interface ISendFile extends IReplaceFile {
  file: File
}

export interface IAddedFile extends IAddedReplaceFile {
  file: File
  field: HTMLDivElement
}
export interface IFileForm {
  name?: string
  type?: AssetType
}

export interface IFileRes {
  files: IAssets
  dupes: string[]
}

export interface IFileRep {
  file?: IAsset
  dupe?: string
}
