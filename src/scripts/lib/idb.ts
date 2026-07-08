import { IAsset, IAssets } from "../types/LibTypes"
import { UGCData, UGCMeta, UGCRef } from "../Creator/types/CreatorTypes"
import { FileDataType, IFileRep, IFileRes, IReplaceFile, ISendFile } from "../types/IndexedDbTypes"
import { astPath, modsPath, sysPath } from "./dbVar"
import { genStringId, rStr, sanitizeName } from "../Creator/lib/gen"
import { vfs } from "./VirtualFileSystem"
import { UGMRef, UGMTree } from "../Code/types/CodeTypes"

export class Virtualdb {
  data: UGCData = {}
  private isLoaded: boolean = false

  private async saveAll(projectId: string): Promise<void> {
    this.data[projectId].meta.modified = Date.now()

    await vfs.saveFile(projectId, sysPath, "meta.json", "json", this.data[projectId].meta)
    await vfs.saveFile(projectId, sysPath, "assets.json", "json", this.data[projectId].assets)
    await vfs.saveFile(projectId, sysPath, "startend.json", "json", this.data[projectId].startend)
    await vfs.saveFile(projectId, sysPath, "maps.json", "json", this.data[projectId].maps)
    await vfs.saveFile(projectId, sysPath, "items.json", "json", this.data[projectId].items)
    await vfs.saveFile(projectId, sysPath, "settings.json", "json", this.data[projectId].settings)
  }

  async save(projectId: string, key?: keyof UGCRef): Promise<void> {
    if (!key) return await this.saveAll(projectId)

    if (key === "meta") {
      this.data[projectId].meta.modified = Date.now()
    }

    await vfs.saveFile(projectId, sysPath, `${key}.json`, "json", this.data[projectId][key])
  }

  async create(projectName: string): Promise<UGCRef | undefined> {
    const projectId = genStringId().toUpperCase()

    const ref: Partial<UGCRef> = {}

    const defMeta: UGCMeta = {
      id: projectId,
      files: 0,
      created: Date.now(),
      modified: Date.now()
    }

    ref.meta = defMeta
    ref.assets = []
    ref.startend = {}
    ref.maps = {}
    ref.items = []
    ref.settings = { project: projectName }

    await vfs.saveFile(projectId, sysPath, "meta.json", "json", ref.meta)
    await vfs.saveFile(projectId, sysPath, "assets.json", "json", ref.assets)
    await vfs.saveFile(projectId, sysPath, "startend.json", "json", ref.startend)
    await vfs.saveFile(projectId, sysPath, "maps.json", "json", ref.maps)
    await vfs.saveFile(projectId, sysPath, "items.json", "json", ref.items)
    await vfs.saveFile(projectId, sysPath, "settings.json", "json", ref.settings)

    const ugcParsed = ref as UGCRef

    this.data[ugcParsed.meta.id] = ugcParsed

    return ugcParsed
  }
  async getProject(projectId: string): Promise<UGCRef | null> {
    const ref: Partial<UGCRef> = {}

    const metaFile = await vfs.readFile(projectId, sysPath, "meta.json")
    const assetsFile = await vfs.readFile(projectId, sysPath, "assets.json")
    const startendFile = await vfs.readFile(projectId, sysPath, "startend.json")
    const mapsFile = await vfs.readFile(projectId, sysPath, "maps.json")
    const itemsFile = await vfs.readFile(projectId, sysPath, "items.json")
    const settingsFile = await vfs.readFile(projectId, sysPath, "settings.json")

    if (!metaFile || !assetsFile || !startendFile || !mapsFile || !itemsFile || !settingsFile) return null

    ref.meta = metaFile
    ref.assets = assetsFile
    ref.startend = startendFile
    ref.maps = mapsFile
    ref.items = itemsFile
    ref.settings = settingsFile

    const ugcParsed = ref as UGCRef

    return ugcParsed
  }
  async deleteProject(projectId: string): Promise<void> {
    const projectTree = await vfs.getProjectTree(projectId)

    for (const project of projectTree) {
      await vfs.deleteFile(projectId, project.folder, project.fileName)
    }

    delete this.data[projectId]
  }
  async uploadFiles(projectId: string, items: ISendFile[]): Promise<IFileRes> {
    const assetsReturn: IAssets = []

    const dupeAssets: string[] = []

    for (const itm of items) {
      const ogName = sanitizeName(itm.name)

      const isDupe = this.data[projectId].assets.some((k) => k.name === ogName)

      if (isDupe) {
        dupeAssets.push(ogName)
      } else {
        const fileSize = ++this.data[projectId].meta.files
        const fileName = rStr() + fileSize
        const fileFull = fileName + (itm.type === "audio" ? ".mp3" : ".png")

        const assetData: IAsset = {
          id: fileName,
          name: ogName,
          type: itm.type,
          path: fileFull,
          vfs: fileFull
        }

        const saveFileType: FileDataType = itm.type === "audio" ? "audio" : "image"

        await vfs.saveFile(projectId, astPath, fileFull, saveFileType, itm.file)

        this.data[projectId].assets.push(assetData)
        assetsReturn.push(assetData)

        this.save(projectId, "assets")
        this.save(projectId, "meta")
      }
    }

    return { files: assetsReturn, dupes: dupeAssets }
  }
  async replaceFile(projectId: string, itm: IReplaceFile): Promise<IFileRep> {
    const ogName = sanitizeName(itm.name)

    const isDupe = this.data[projectId].assets.some((k) => k.name === ogName && k.id !== itm.id)
    if (isDupe) return { dupe: ogName }

    const fileIdx = this.data[projectId].assets.findIndex((k) => k.id === itm.id)
    if (fileIdx === -1) return {}

    this.data[projectId].assets[fileIdx].name = ogName

    this.save(projectId, "assets")

    if (!itm.file) return { file: this.data[projectId].assets[fileIdx] }

    const fileFull = itm.id + (itm.type === "audio" ? ".mp3" : ".png")
    this.data[projectId].assets[fileIdx].path = fileFull
    this.data[projectId].assets[fileIdx].vfs = fileFull

    const saveFileType: FileDataType = itm.type === "audio" ? "audio" : "image"

    await vfs.saveFile(projectId, astPath, fileFull, saveFileType, itm.file)

    this.save(projectId, "meta")

    return { file: this.data[projectId].assets[fileIdx] }
  }
  async deleteFile(projectId: string, itemId: string): Promise<void> {
    const fileIdx = this.data[projectId].assets.findIndex((itm) => itm.id === itemId)
    if (fileIdx === -1) return

    const file = this.data[projectId].assets[fileIdx]
    await vfs.deleteFile(projectId, astPath, file.vfs!)

    this.data[projectId].assets.splice(fileIdx, 1)

    this.save(projectId, "assets")
    this.save(projectId, "meta")

    return
  }
  async load(): Promise<void> {
    if (this.isLoaded) return

    this.isLoaded = true

    const projectIds = await vfs.getAllProjectIds()

    for (const projectId of projectIds) {
      const ref: Partial<UGCRef> = {}

      const metaFile = await vfs.readFile(projectId, sysPath, "meta.json")
      const assetsFile = await vfs.readFile(projectId, sysPath, "assets.json")
      const startendFile = await vfs.readFile(projectId, sysPath, "startend.json")
      const mapsFile = await vfs.readFile(projectId, sysPath, "maps.json")
      const itemsFile = await vfs.readFile(projectId, sysPath, "items.json")
      const settingsFile = await vfs.readFile(projectId, sysPath, "settings.json")

      ref.meta = metaFile
      ref.assets = assetsFile || []
      ref.startend = startendFile || {}
      ref.maps = mapsFile || {}
      ref.items = itemsFile || []
      ref.settings = settingsFile

      const ugcParsed = ref as UGCRef

      this.data[ugcParsed.meta.id] = ugcParsed
    }
  }
  async getModsTree(): Promise<UGMTree[]> {
    const modsTree: UGMTree[] = []

    const projectIds = await vfs.getAllProjectIds()

    for (const projectId of projectIds) {
      const modTree: Partial<UGMTree> = {}

      const metaFile = await vfs.readFile(projectId, sysPath, "meta.json")
      const settingsFile = await vfs.readFile(projectId, sysPath, "settings.json")
      const modlangFile = await vfs.readFile(projectId, modsPath, "modlang.json")

      modTree.id = projectId
      modTree.project = settingsFile.project
      modTree.created = metaFile.created
      modTree.modified = metaFile.modified
      if (modlangFile) modTree.modLanguage = modlangFile

      modsTree.push(modTree as UGMTree)
    }

    return modsTree
  }

  async getModValues(projectId: string): Promise<UGMRef> {
    const scriptFile = await vfs.readFile(projectId, modsPath, "Script")
    const styleFile = await vfs.readFile(projectId, modsPath, "Style")

    return { script: scriptFile, style: styleFile }
  }
}

export const idb = new Virtualdb()
