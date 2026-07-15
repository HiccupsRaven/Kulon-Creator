import asset from "../data/assets"
import { audioContext, sound } from "../data/sound"
import { IAssets, IAssetContent } from "../types/LibTypes"
import { eroot } from "./kel"

type IAnyFunc = (val?: unknown) => void

const assetsMissing: string[] = []

interface LoadAssetConfig {
  files: IAssets
}

export default class LoadAssets {
  private files: IAssets
  private assets: IAssetContent[]

  private assetsToLoad: number = 0
  private assetsLoaded: number = 0

  private onComplete!: IAnyFunc

  constructor(s: LoadAssetConfig) {
    this.files = s.files
    this.assets = []
  }
  async loadPrepare() {
    this.assets = this.readAssets()
    this.load()
  }
  load(): void {
    if (!this.assets || this.assets.length < 1) {
      return this.showDone()
    }
    this.assetsToLoad = this.assets.length

    if (this.assets.length >= 1) {
      for (let i = 0; i < this.assets.length; i++) {
        if (this.assets[i].type === "image") {
          this.beginLoadingImage(this.assets[i].id, this.assets[i].content)
        } else if (this.assets[i].type === "audio") {
          this.beginLoadingAudio(this.assets[i].id, this.assets[i].content)
        }
      }
    }
  }
  readAssets(): IAssetContent[] {
    return this.files.map((file) => ({ id: file.id, content: file.path, type: file.type === "audio" ? "audio" : "image" }))
  }
  unhandledAssets(fileID: string, fileName: string, fileType: number): void {
    this.assetsToLoad++
    this.assetsLoaded--

    const fileBefore = assetsMissing.find((k) => k === fileID)
    if (!fileBefore) assetsMissing.push(fileID)

    if (fileType === 2) {
      this.beginLoadingAudio(fileID, fileName)
    } else {
      this.beginLoadingImage(fileID, fileName)
    }
  }
  launchIfReady(): void {
    this.assetsToLoad--
    this.assetsLoaded++
    if (this.assetsToLoad == 0) {
      this.showDone()
    }
  }
  beginLoadingImage(fileID: string, fileName: string): void {
    const img = new Image()
    img.classList.add("hidden-preload")
    img.onerror = () => {
      this.unhandledAssets(fileID, fileName, 1)
      this.launchIfReady()
      img.remove()
    }
    img.onload = () => {
      const fileBefore = assetsMissing.findIndex((k) => k === fileID)
      if (fileBefore !== -1) assetsMissing.splice(fileBefore, 1)

      this.launchIfReady()
      img.remove()
    }
    img.src = fileName
    eroot().append(img)
    asset[fileID] = { src: fileName }
  }
  async beginLoadingAudio(fileID: string, fileName: string): Promise<void> {
    try {
      const response = await fetch(fileName)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const arrayBuffer = await response.arrayBuffer()

      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }

      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      sound[fileID] = { buffer: audioBuffer, src: fileName }
      const fileBefore = assetsMissing.findIndex((k) => k === fileID)
      if (fileBefore !== -1) assetsMissing.splice(fileBefore, 1)
    } catch (_error) {
      this.unhandledAssets(fileID, fileName, 2)
      // console.error(`Error audio decoded: ${fileName}`, error)
    } finally {
      this.launchIfReady()
    }
  }
  showDone(): void {
    this.onComplete()
  }
  run() {
    return new Promise((resolve) => {
      this.onComplete = resolve
      this.loadPrepare()
    })
  }
}
