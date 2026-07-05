import asset from "../data/assets"
import lang from "../data/language"
import { eroot, futor, kel, qutor } from "../lib/kel"
import modal from "../lib/modal"
import waittime from "../lib/waittime"
import { setTestWorld, startGame } from "../manager/startGame"
import assetSize from "../../../public/json/skins/size.json"
import audio from "../lib/AudioHandler"
import { sound, audioContext } from "../data/sound"
import { KeyPressListener } from "../main/KeyPressListener"
import { IAssets, IAssetContent } from "../types/LibTypes"
import screenfull from "screenfull"
import ForceClose from "./ForceClose"
import { UGCRef } from "../Creator/types/CreatorTypes"
import { work } from "../manager/WorkWorld"
import { idb } from "../lib/idb"
import { vfs } from "../lib/VirtualFileSystem"

const preloadIcons = ['<i class="fa-jelly fa-regular fa-cloud"></i>', '<i class="fa-solid fa-compact-disc"></i>', '<i class="fa-duotone fa-solid fa-circle-xmark"></i>', '<i class="fa-duotone fa-regular fa-gem"></i>', '<i class="fa-regular fa-briefcase"></i>', '<i class="fa-sharp-duotone fa-solid fa-address-book"></i>', '<i class="fa-etch fa-solid fa-mobile"></i>', '<i class="fa-jelly-fill fa-regular fa-gamepad"></i>']

async function forceFullScreen() {
  const width = window.innerWidth
  const height = window.innerHeight

  const urlParams = new URLSearchParams(window.location.search)
  const pwa = urlParams.get("pwa")

  if ((width < 720 || height < 480) && !pwa) {
    const docEl = document.documentElement

    if (screenfull.isEnabled) screenfull.request(docEl, { navigationUI: "hide" })

    if (screen.orientation && "lock" in screen.orientation && typeof screen.orientation["lock"] === "function") {
      try {
        await screen.orientation["lock"]("landscape")
      } catch (_err) {
        // --
      }
    }
  }
}

const assetsMissing: string[] = []

interface IConfig {
  files: IAssets
}

interface IAssetProgress {
  text: HTMLDivElement
  bar: HTMLDivElement
}

export default class Preload {
  private files: IAssets
  private assets: IAssetContent[] = []

  private propsToLoad: number = 0
  private propsLoaded: number = 0
  private allProps: number = 0

  private el: HTMLDivElement = kel("div", "Preload")

  private enter?: KeyPressListener
  constructor({ files }: IConfig) {
    this.files = files
  }
  createElement(): void {
    this.el.innerHTML = `
    <div class="box">
      <div class="title">
        <img src="./images/Kulon.png" alt="kulon" width="200"/>
      </div>
      <div class="assetload-data">
        <div class="load-data-title">${lang.PRELOAD_NOTICE}</div>
        <div class="load-data-list">
          <p class="preload-icons">${preloadIcons.join("")}</p>
          <i><small>${lang.PRELOAD_TIME}</small></i>
        </div>
      </div>
    </div>
    <div class="assetload-action">
      <div class="btn-start center fa-fade">-- <span class="keyinfo">Enter</span> ${lang.TS_START} --</div>
    </div>`
  }
  writeLoadData(): void {
    const loadList = futor(".load-data-list", this.el)
    const convertOp = 1024 * 1024

    const convertedSize = (assetSize.Total / convertOp).toFixed(2)
    const card = kel("div", "load-data-card")
    card.innerHTML = `<b>${convertedSize} MB</b>`
    loadList.prepend(card)
  }
  btnListener(): void {
    const btnLoad = futor(".assetload-action", this.el)
    btnLoad.onclick = async () => {
      this.enter?.unbind()
      await forceFullScreen()
      btnLoad.remove()
      await waittime(500)
      const eloadel = kel("div", "assets-load")
      eloadel.innerHTML = `
      <div class="info">
        <span>${lang.LOADING}</span>
        <span class="status">Ehek <small><i class="fa-solid fa-circle-notch fa-spin"></i></small></span>
      </div>
      <div class="loader">
        <div class="inner-loader"></div>
      </div>`
      this.el.append(eloadel)
      await waittime(200)
      this.loadPrepare()
    }
    this.enter = new KeyPressListener("enter", () => btnLoad.click())
  }
  async loadPrepare(): Promise<void> {
    this.assets = this.readAssets()

    const assetProgress: IAssetProgress = {
      text: futor(".assets-load .info .status", this.el) as HTMLDivElement,
      bar: futor(".assets-load .loader .inner-loader", this.el) as HTMLDivElement
    }

    this.load(assetProgress)
  }
  load(assetProgress: IAssetProgress): void {
    if (!this.assets || this.assets.length < 1) {
      this.showDone()
      return
    }
    this.propsToLoad = this.assets.length
    if (this.assets.length >= 1) {
      for (let i = 0; i < this.assets.length; i++) {
        if (this.assets[i].type === "image") {
          this.beginLoadingImage(this.assets[i].id, this.assets[i].content, assetProgress)
        } else if (this.assets[i].type === "audio") {
          this.beginLoadingAudio(this.assets[i].id, this.assets[i].content, assetProgress)
        }
      }
    }

    this.allProps = this.assets.length || 0
  }
  readAssets(): IAssetContent[] {
    return this.files.map((file) => ({ id: file.id, content: file.path, type: file.type === "audio" ? "audio" : "image" }))
  }
  unhandledAssets(fileID: string, fileName: string, progress: IAssetProgress, fileType: number): void {
    this.propsToLoad++
    this.propsLoaded--

    const fileBefore = assetsMissing.find((k) => k === fileID)
    if (!fileBefore) assetsMissing.push(fileID)

    if (fileType === 2) {
      this.beginLoadingAudio(fileID, fileName, progress)
    } else {
      this.beginLoadingImage(fileID, fileName, progress)
    }
  }
  launchIfReady(assetProgress: IAssetProgress, fileID: string): void {
    if (fileID === "null") fileID = "Koruptor"
    this.propsToLoad--
    this.propsLoaded++

    const currProgress = `${Math.floor((this.propsLoaded / this.allProps) * 100)}%`

    assetProgress.text.innerHTML = `${fileID} - ${currProgress}`
    assetProgress.bar.style.width = currProgress

    if (this.propsToLoad == 0) {
      assetProgress.text.innerHTML = "Koruptor_Suit - 100%"
      this.showDone()
    }
  }
  beginLoadingImage(fileID: string, fileName: string, assetProgress: IAssetProgress): void {
    const img = new Image()
    img.classList.add("hidden-preload")
    img.onerror = () => {
      this.unhandledAssets(fileID, fileName, assetProgress, 1)
      this.launchIfReady(assetProgress, fileID)
      img.remove()
    }
    img.onload = () => {
      const fileBefore = assetsMissing.findIndex((k) => k === fileID)
      if (fileBefore !== -1) assetsMissing.splice(fileBefore, 1)

      this.launchIfReady(assetProgress, fileID)
      img.remove()
    }
    img.src = fileName
    this.el.append(img)

    // this.launchIfReady(assetProgress, loadscreen, fileID)
    asset[fileID] = { src: fileName }
  }
  async beginLoadingAudio(fileID: string, fileName: string, assetProgress: IAssetProgress): Promise<void> {
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
      this.unhandledAssets(fileID, fileName, assetProgress, 2)
      // console.error(`Error audio decoded: ${fileName}`, error)
    } finally {
      this.launchIfReady(assetProgress, fileID)
    }
  }
  async showDone(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search)
    const ugcId = urlParams.get("ugc")
    if (!ugcId) {
      new ForceClose({
        msg_1: '<i class="fa-duotone fa-solid fa-do-not-enter"></i>',
        msg_2: "No UGC parameter found. Please check your url."
      })
      return
    }

    await waittime(1000)

    const eloader = qutor(".assets-load", this.el)
    if (eloader) eloader.remove()

    await vfs.init()

    // const initialData = await modal.smloading(xhr.get(`/x/ugc/test/${ugcId.toString()}?v=${Date.now()}`), "Getting UGC Detail")
    const initialData = await modal.smloading(idb.getProject(ugcId.toString()), "Getting UGC Detail")

    if (!initialData) {
      new ForceClose({
        msg_1: '<i class="fa-duotone fa-solid fa-do-not-enter"></i>',
        msg_2: initialData.msg || "No UGC Data found. Is your UGC ID correct?."
      })
      return
    }

    const data = initialData as UGCRef

    await modal.smloading(setTestWorld(data), "Loading UGC Data")

    audio.emit({ action: "play", type: "ui", src: "dialogue_end", options: { id: "dialogue_end", lossVol: 50 } })

    await this.destroy()

    startGame(work, true)
  }
  async destroy(): Promise<void> {
    this.el.classList.add("out")
    await waittime(1000, 5)
    this.el.remove()
  }
  init(): void {
    this.createElement()
    eroot().append(this.el)
    this.writeLoadData()
    this.btnListener()
  }
}
