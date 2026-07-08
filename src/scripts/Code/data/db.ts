import { toObject } from "../../Creator/lib/gen"
import { IModLanguage, UGMRef, UGMTree } from "../types/CodeTypes"

interface ILocalDB extends UGMTree, UGMRef {
  modLanguage: IModLanguage
  script: string
  style: string
}

export const db: ILocalDB = {
  created: 0,
  id: "0",
  modified: 0,
  modLanguage: { script: "typescript", style: "scss" },
  project: "unamed",
  script: "",
  style: ""
}

export function setInitDB(ugm: UGMTree, modValues: UGMRef): void {
  db.id = ugm.id.toString()
  db.created = Number(ugm.created)
  db.modified = Number(ugm.modified)
  db.project = ugm.project.toString()
  db.modLanguage = toObject(ugm.modLanguage)
  db.script = modValues.script?.toString() || ""
  db.style = modValues.style?.toString() || ""
}
