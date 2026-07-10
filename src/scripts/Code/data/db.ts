import { toObject } from "../../Creator/lib/gen"
import { IModLanguage, UGMRefExtended, UGMTree } from "../types/CodeTypes"

interface ILocalDB extends UGMTree, UGMRefExtended {
  modLanguage: IModLanguage
  script: string
  style: string
  assets: string
}

export const db: ILocalDB = {
  created: 0,
  id: "0",
  modified: 0,
  modLanguage: { script: "typescript", style: "scss" },
  project: "unamed",
  script: "",
  style: "",
  assets: ""
}

export function setInitDB(ugm: UGMTree, modValues: UGMRefExtended): void {
  db.id = ugm.id.toString()
  db.created = Number(ugm.created)
  db.modified = Number(ugm.modified)
  db.project = ugm.project.toString()

  setEdiorDB(ugm.modLanguage!, modValues)
}

export function setEdiorDB(modLang: IModLanguage, modValues: UGMRefExtended): void {
  db.modLanguage = toObject(modLang)

  const script = modValues.script?.toString() || ""
  const style = modValues.style?.toString() || ""
  const assets = modValues.assets?.toString() || ""

  db.script = script
  db.style = style
  db.assets = assets
}
