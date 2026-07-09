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
  db.modLanguage = toObject(ugm.modLanguage)

  const script = modValues.script?.toString() || ""
  const style = modValues.style?.toString() || ""
  const assets = modValues.assets

  db.script = script
  db.style = style
  db.assets = JSON.stringify(assets ?? [], null, 2)
}
