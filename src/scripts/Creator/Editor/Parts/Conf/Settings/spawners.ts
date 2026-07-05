import { futor, kel } from "../../../../../lib/kel"
import { work } from "../../../../data/work"
import { IWorldSpawnRule } from "../../../../types/CreatorTypes"
import { EditorPrompted } from "../../Sys/EditorPrompted"
import { GameSettings } from "../GameSettings"

interface SpawnRadio {
  html: HTMLDivElement
  input: HTMLInputElement
}
export function createSpawnRadio(id: string): SpawnRadio {
  const el = kel("div", "i")
  el.innerHTML = `<div class="radio"><label for="st-ps-${id}"><span>P${id}</span></label></div>`

  const inp = kel("input")
  inp.type = "radio"
  inp.name = "st-ps"
  inp.id = `st-ps-${id}`
  inp.value = id.toString()

  const label = futor("label", el, "label")
  label.prepend(inp)

  return { html: el, input: inp }
}

let isLocked: boolean = false

export function createSpawnFields(id: string, gameSettings: GameSettings, rule?: IWorldSpawnRule): HTMLDivElement[] {
  const direction = rule?.direction || "down"

  const mapField = kel("div", "f f-st", { a: { "x-field": "spawn" } })
  mapField.innerHTML = `
  <div class="i">
    <div class="tx center"><b>Player ${id}</b></div>
    <div class="inp">
      <label for="st-spawn-placeholder-map-${id}">*Map</label>
      <input type="text" name="st-spawn-placeholder-map-${id}" id="st-spawn-placeholder-map-${id}" autocomplete="off" readonly />
      <input class="hide" type="text" name="st-spawn-map-${id}" id="st-spawn-map-${id}" autocomplete="off" readonly />
      <div class="btn btn-find find-coor-${id}">Select map and tile</div>
    </div>
  </div>`

  const posField = kel("div", "f f-st", { a: { "x-field": "spawn" } })
  posField.innerHTML = `
  <div class="i">
    <div class="f p">
      <div class="i">
        <div class="inp">
          <label for="st-spawn-x-${id}">*X</label>
          <input type="text" name="st-spawn-x-${id}" id="st-spawn-x-${id}" autocomplete="off" placeholder="x (on grid)" />
        </div>
      </div>
      <div class="i">
        <div class="inp">
          <label for="st-spawn-y-${id}">*Y</label>
          <input type="text" name="st-spawn-y-${id}" id="st-spawn-y-${id}" autocomplete="off" placeholder="y (on grid)" />
        </div>
      </div>
    </div>
    <div class="f p">
      <div class="btn btn-find find-coor-${id}">Select map and tile</div>
    </div>
  </div>`

  const dirField = kel("div", "f f-st", { a: { "x-field": "spawn" } })
  dirField.innerHTML = `
  <div class="i">
    <p class="tx">*Facing Direction</p>
    <div class="f p">
      <div class="i">
        <div class="radio">
          <label for="st-spawn-direction-${id}-left">
            <input type="radio" name="st-spawn-direction-${id}" id="st-spawn-direction-${id}-left" value="left" ${direction === "left" ? "checked " : ""}/>
            <span>Left</span>
          </label>
        </div>
      </div>
      <div class="i">
        <div class="radio">
          <label for="st-spawn-direction-${id}-down">
            <input type="radio" name="st-spawn-direction-${id}" id="st-spawn-direction-${id}-down" value="down" ${direction === "down" ? "checked " : ""}/>
            <span>Down</span>
          </label>
        </div>
      </div>
      <div class="i">
        <div class="radio">
          <label for="st-spawn-direction-${id}-right">
            <input type="radio" name="st-spawn-direction-${id}" id="st-spawn-direction-${id}-right" value="right" ${direction === "right" ? "checked " : ""}/>
            <span>Right</span>
          </label>
        </div>
      </div>
      <div class="i">
        <div class="radio">
          <label for="st-spawn-direction-${id}-up">
            <input type="radio" name="st-spawn-direction-${id}" id="st-spawn-direction-${id}-up" value="up" ${direction === "up" ? "checked " : ""}/>
            <span>Up</span>
          </label>
        </div>
      </div>
    </div>
  </div>`

  const mapBefore = gameSettings.editor.currentMap

  const inpMapName = futor(`#st-spawn-placeholder-map-${id}`, mapField) as HTMLInputElement
  const inpMapId = futor(`#st-spawn-map-${id}`, mapField) as HTMLInputElement
  const inpX = futor(`#st-spawn-x-${id}`, posField) as HTMLInputElement
  const inpY = futor(`#st-spawn-y-${id}`, posField) as HTMLInputElement

  const updateData = (s?: { newX?: number; newY?: number; newMap?: string }) => {
    const x = (s?.newX ?? rule?.x)?.toString() || ""
    const y = (s?.newY ?? rule?.y)?.toString() || ""
    const map = s?.newMap || rule?.map || ""
    const mapName = map && work[map]?.name ? work[map].name : "- No Map Selected"

    inpMapName.value = mapName

    inpMapId.value = map

    inpX.value = x

    inpY.value = y
  }

  const findCoorMap = () => {
    if (isLocked) return
    isLocked = true

    gameSettings.hide()
    gameSettings.lock()

    const editorPrompt = new EditorPrompted(gameSettings.editor, "Select any map and tile")
    editorPrompt.start()

    gameSettings.editor.mapToBack(mapBefore!)

    gameSettings.editor.findTile((x, y, map) => {
      isLocked = false
      gameSettings.hide(false)
      gameSettings.lock(false)
      editorPrompt.end()

      const statMid = !gameSettings.editor.middle.locked
      const statTop = !gameSettings.editor.top.locked
      const statBtm = !gameSettings.editor.bottom.locked

      gameSettings.editor.middle.lock(false)
      gameSettings.editor.top.lock(false)
      gameSettings.editor.bottom.lock(false)

      gameSettings.editor.startMap(mapBefore!)
      gameSettings.editor.mapToBack(null)

      gameSettings.editor.middle.lock(!statMid)
      gameSettings.editor.top.lock(!statTop)
      gameSettings.editor.bottom.lock(!statBtm)

      if (typeof x === "number" && typeof y === "number" && map) {
        updateData({ newX: x, newY: y, newMap: map })
      }
    })
  }

  const btnFindCoorMap = futor(`.find-coor-${id}`, mapField)
  btnFindCoorMap.onclick = () => findCoorMap()

  const btnFindCoorPos = futor(`.find-coor-${id}`, posField)
  btnFindCoorPos.onclick = () => findCoorMap()

  updateData()

  return [mapField, posField, dirField]
}
