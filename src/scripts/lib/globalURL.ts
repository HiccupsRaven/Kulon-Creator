import { IAssets } from "../types/LibTypes"
import { astPath } from "./dbVar"
import { vfs } from "./VirtualFileSystem"

const OBJECT_URLS: string[] = []

export async function addToGlobalUrl(id: string, newAssets: IAssets): Promise<IAssets> {
  const assetsToReturn: IAssets = []

  for (let i = 0; i < newAssets.length; i++) {
    const itm = newAssets[i]

    const fileOri = await vfs.readFile(id, astPath, itm.vfs!)

    const newPath = URL.createObjectURL(fileOri)

    OBJECT_URLS.push(newPath)

    assetsToReturn.push({
      id: newAssets[i].id,
      name: newAssets[i].name,
      type: newAssets[i].type,
      path: newPath,
      vfs: newAssets[i].vfs
    })
  }

  return assetsToReturn
}

export function deleteGlobalUrl(): void {
  OBJECT_URLS.forEach((k) => URL.revokeObjectURL(k))
  OBJECT_URLS.splice(0, OBJECT_URLS.length)
}
