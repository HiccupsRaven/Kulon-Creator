import { futor, kel } from "../../../../lib/kel"
import { work } from "../../../data/work"
import { IMapConfig } from "../../../types/CreatorTypes"
import { inlineEmpty } from "../../_inlineMsg"
import { FootStepSelect } from "./FootStepSelect"
import { AmbienceSelect } from "./AmbienceSelect"
import { NewMap } from "../../Forms/NewMap"
import { EditorConf } from "../EditorConf"
import { EditorPrompted } from "../Sys/EditorPrompted"
import { doTell } from "../../../lib/tell"
import modal from "../../../../lib/modal"
import { toText } from "../../../lib/gen"

export interface ButtonConfig {
  id: string
  html: HTMLDivElement
}

export interface EditorConfConfig {
  conf: EditorConf
}

export class ConfigMap {
  private el!: HTMLDivElement

  conf: EditorConf

  private list: ButtonConfig[] = []

  constructor(config: EditorConfConfig) {
    this.conf = config.conf
  }
  private createElement(): void {
    this.el = kel("div", "box-content")
  }

  private writeData(): void {
    const emptyList = inlineEmpty("No Map Found")

    const btnRename = kel("div", "btn btn-rename")
    btnRename.innerHTML = '<i class="fa-solid fa-i fa-fw"></i> <span>Rename Map</span>'
    this.setEditMapMain(btnRename)

    const btnSources = kel("div", "btn btn-rename")
    btnSources.innerHTML = '<i class="fa-solid fa-image fa-fw"></i> <span>Image Sources</span>'
    this.setEditMapMain(btnSources)

    const btnSafeZone = kel("div", "btn btn-safezone")
    btnSafeZone.innerHTML = '<i class="fa-solid fa-location-dot fa-fw"></i> <span>Safe Coordinate</span>'
    this.setSafeZone(btnSafeZone)

    const btnAmbience = kel("div", "btn btn-ambience")
    btnAmbience.innerHTML = '<i class="fa-solid fa-music-note fa-fw"></i> <span>Ambience Sound</span>'
    this.setAmbience(btnAmbience)

    const btnFootStep = kel("div", "btn btn-footstep")
    btnFootStep.innerHTML = '<i class="fa-solid fa-shoe-prints fa-fw"></i> <span>Footstep Sound</span>'
    this.setFootStep(btnFootStep)

    const btnWeather = kel("div", "check btn-weather")
    btnWeather.innerHTML = `<label for="conf-weather">
      <i class="fa-solid fa-cloud-moon-rain fa-fw"></i>
      <input type="checkbox" name="conf-weather" id="conf-weather" value="true" />
      <span>Allow Weather</span>
    </label>`

    this.setWeather(btnWeather)

    const btnDelete = kel("div", "btn btn-delete")
    btnDelete.innerHTML = '<i class="fa-solid fa-trash-can fa-fw"></i> <span>Delete Map</span>'
    this.setMapDelete(btnDelete)

    this.list.push({ id: "empty", html: emptyList }, { id: "rename", html: btnRename }, { id: "sources", html: btnSources }, { id: "safezone", html: btnSafeZone }, { id: "ambience", html: btnAmbience }, { id: "footstep", html: btnFootStep }, { id: "weather", html: btnWeather }, { id: "delete", html: btnDelete })
  }

  private setEditMapMain(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()
      const editedMap = new NewMap({
        sys: this.conf.middle.sys,
        fromId: this.conf.middle.editor.curMap
      })
      editedMap.init()
    }
  }

  private setSafeZone(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()

      let prompMsg = "Select 1 tile inside playzone to create unstuck coordinate"

      const curMap = this.conf.middle.editor.curMap
      if (work[curMap!].safeZone?.x && work[curMap!].safeZone?.y) {
        const { x, y } = work[curMap!].safeZone!
        prompMsg += `<br/>Current: ${x}x ${y}y`
      }

      const editorPrompt = new EditorPrompted(this.conf.middle.editor, prompMsg)
      editorPrompt.start()

      this.conf.middle.editor.findTile((x, y) => {
        editorPrompt.end()
        this.conf.middle.lock(false)
        if (typeof x !== "number" || typeof y !== "number") return
        work[this.conf.middle.editor.curMap!].safeZone = { x, y }
        doTell(`Safe coordinate saved: <b>${x}x ${y}y</b>`)
      })
    }
  }

  private setWeather(btn: HTMLDivElement): void {
    const inp = futor("input", btn) as HTMLInputElement
    inp.onchange = () => {
      if (this.conf.middle.editor.locked) return
      work[this.conf.middle.editor.curMap!].useWeather = inp.checked
    }
  }

  private setAmbience(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()

      const ambienceSelect = new AmbienceSelect({
        confMap: this,
        ambience: work[this.conf.middle.editor.curMap!].ambience
      })

      ambienceSelect.onDone((ambSound?: IMapConfig["ambience"], isDeleted?: boolean) => {
        this.conf.middle.lock(false)
        if (ambSound && isDeleted) {
          delete work[this.conf.middle.editor.curMap!].ambience
          return
        }
        if (ambSound) {
          work[this.conf.middle.editor.curMap!].ambience = ambSound
        }
      })

      ambienceSelect.init()
    }
  }
  private setFootStep(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()

      const footStepSelect = new FootStepSelect({
        confMap: this,
        footstep: work[this.conf.middle.editor.curMap!].footstep
      })

      footStepSelect.onDone((footStepSound?: IMapConfig["footstep"]) => {
        this.conf.middle.lock(false)
        if (footStepSound) {
          work[this.conf.middle.editor.curMap!].footstep = footStepSound
        }
      })

      footStepSelect.init()
    }
  }

  private setMapDelete(btn: HTMLDivElement): void {
    btn.onclick = async () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()

      const mapId = this.conf.middle.editor.curMap!
      const map = work[mapId]
      const confDelete = await modal.confirm({
        msg: `Are you sure want to delete map <b>${toText(map.name)}</b>?`,
        okx: "YES, DELETE",
        cancelx: "NO"
      })

      if (!confDelete) {
        this.conf.middle.lock(false)
        return
      }

      const confDeleteReal = await modal.confirm({
        msg: `So.. You're really <b>that</b> serious about deleting Map <b>${toText(map.name)}</b>, huh?`,
        okx: "DO IT NOW!",
        cancelx: "MAYBE DO NOT"
      })

      if (!confDeleteReal) {
        this.conf.middle.lock(false)
        return
      }

      this.conf.middle.lock(false)
      this.conf.middle.editor.parseDeletedMap(map.id, map.name)
    }
  }

  checkWeather(): void {
    const checkEl = this.list.find((k) => k.id === "weather")
    if (!checkEl) return

    const inp = futor("input", checkEl.html) as HTMLInputElement
    inp.checked = work[this.conf.middle.editor.curMap!].useWeather || false
  }

  checkCurrentMap(): void {
    while (this.el.firstChild) {
      this.el.firstChild.remove()
    }

    this.list.forEach((k) => {
      if (this.conf.middle.editor.curMap) {
        if (k.id === "empty" && this.el.contains(k.html)) return this.el.removeChild(k.html)
        if (k.id !== "empty" && !this.el.contains(k.html)) return this.el.appendChild(k.html)
      } else {
        if (k.id !== "empty" && this.el.contains(k.html)) return this.el.removeChild(k.html)
        if (k.id === "empty" && !this.el.contains(k.html)) return this.el.appendChild(k.html)
      }
    })
  }

  get html(): HTMLDivElement {
    return this.el
  }

  init(): this {
    this.createElement()
    this.writeData()
    return this
  }
}
