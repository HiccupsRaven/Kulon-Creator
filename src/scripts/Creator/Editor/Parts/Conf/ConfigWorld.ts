import { kel } from "../../../../lib/kel"
import { db } from "../../../data/db"
import { toObject } from "../../../lib/gen"
import { IGameSettings, IObjectTalk } from "../../../types/CreatorTypes"
import { NewCutscene } from "../../Forms/NewCutscene"
import { EditorConf } from "../EditorConf"
import { EditorCutscenes } from "../Sys/EditorCutscenes"
import { EditorItems } from "../Sys/EditorItems"
import { EditorObjects } from "../Sys/EditorObjects"
import { GameSettings } from "./GameSettings"

export interface EditorConfConfig {
  conf: EditorConf
}

export class ConfigWorld {
  private el!: HTMLDivElement

  conf: EditorConf

  constructor(config: EditorConfConfig) {
    this.conf = config.conf
  }
  private createElement(): void {
    this.el = kel("div", "box-content")
  }

  private writeData(): void {
    const btnItems = kel("div", "btn btn-items")
    btnItems.innerHTML = '<i class="fa-solid fa-backpack fa-fw"></i> <span>Items</span>'
    this.setItemsManager(btnItems)

    const btnObjects = kel("div", "btn btn-objects")
    btnObjects.innerHTML = '<i class="fa-solid fa-object-group fa-fw"></i> <span>Objects</span>'
    this.setObjectsManager(btnObjects)

    const btnCutsceneSpaces = kel("div", "btn btn-cutscenes")
    btnCutsceneSpaces.innerHTML = '<i class="fa-solid fa-object-group fa-fw"></i> <span>Cutscene Spaces</span>'
    this.setCutsceneSpacesManager(btnCutsceneSpaces)

    const btnScenes = kel("div", "btn btn-scene")
    btnScenes.innerHTML = '<i class="fa-solid fa-person-running fa-fw"></i> <span>Starting/Ending</span>'
    this.setScenesManager(btnScenes)

    const btnSettings = kel("div", "btn btn-settings")
    btnSettings.innerHTML = '<i class="fa-solid fa-gear fa-fw"></i> <span>Game Settings</span>'
    this.setGameSettings(btnSettings)

    this.el.append(btnItems, btnObjects, btnCutsceneSpaces, btnScenes, btnSettings)
  }

  private setItemsManager(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()
      const editorItems = new EditorItems(this.conf.middle.editor)
      editorItems.onDone(() => this.conf.middle.lock(false))
      editorItems.init()
    }
  }

  private setObjectsManager(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()
      const editorObjets = new EditorObjects({ editor: this.conf.middle.editor })
      editorObjets.onDone(() => this.conf.middle.lock(false))
      editorObjets.init()
    }
  }

  private setCutsceneSpacesManager(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()
      const editorCutscenes = new EditorCutscenes({ editor: this.conf.middle.editor })
      editorCutscenes.onDone(() => this.conf.middle.lock(false))
      editorCutscenes.init()
    }
  }

  private setScenesManager(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      this.conf.middle.lock()
      const cutscene = new NewCutscene({
        editor: this.conf.middle.editor,
        type: "startend",
        events: toObject([{ events: db.startend.start || [] }, { events: db.startend.end || [] }])
      })
      cutscene.onDone((s, isCanceled) => {
        const data = s?.cutscene

        this.parseStartEnd(data, isCanceled)
      })
      cutscene.init()
    }
  }

  private setGameSettings(btn: HTMLDivElement): void {
    btn.onclick = () => {
      if (this.conf.middle.editor.locked) return
      const gameSettings = new GameSettings(this.conf.middle.editor)
      gameSettings.onDone((s?: IGameSettings) => {
        if (s) {
          db.settings = toObject(s)
          this.conf.middle.sys.updateTitle()
        }
      })
      gameSettings.init()
    }
  }

  private parseStartEnd(data?: IObjectTalk[], isCanceled?: boolean): void {
    this.conf.middle.lock(false)
    if (isCanceled) return
    if (data) {
      const endingEvents = data[1]?.events || []
      const startingEvents = data[0]?.events || []

      db.startend = toObject({
        end: endingEvents,
        start: startingEvents
      })
    }
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
