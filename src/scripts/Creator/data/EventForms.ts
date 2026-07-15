import { sound } from "../../data/sound"
import { futor, kel } from "../../lib/kel"
import modal from "../../lib/modal"
import { FilePicker } from "../Editor/Forms/FilePicker"
import { genStringId } from "../lib/gen"
import { EditorItems } from "../Editor/Parts/Sys/EditorItems"
import { EditorObjects } from "../Editor/Parts/Sys/EditorObjects"
import { EditorPrompted } from "../Editor/Parts/Sys/EditorPrompted"
import { IChoiceOption, ICloudItem, IEventForms, ILocale, IWalk } from "../types/CreatorTypes"
import { db } from "./db"
import { objectList } from "./objectList"
import { work } from "./work"

let isLocked: boolean = false

export const EventForms: IEventForms = {
  textMessage(_, itm) {
    const name = itm?.name?.id ? `${itm.name.id} \\ ${itm.name.en}` : ""
    const text = itm?.text?.id ? `${itm.text.id} \\ ${itm.text.en}` : ""
    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-name"><small>(Optional)</small> Name <small>- separate language with \\ (id\\en)</small></label>
          <input type="text" name="evt-name" id="evt-name" placeholder="Pak Rudi \\ Mr. Elarion Lumea" autocomplete="off" maxlength="200" value="${name}" />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-text">*Text <small>- separate language with \\ (id\\en)</small></label>
          <textarea name="evt-text" id="evt-text" autocomplete="off" maxlength="3000" placeholder="Ambilin buku dulu gih \\ Bring me the book" required>${text}</textarea>
        </div>
      </div>
    </div>`

    return childs
  },
  changeMap(event, itm) {
    const direction = itm?.direction || "down"
    const door = itm?.door

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="placeholder-map">*Destination Map</label>
          <input type="text" name="placeholder-map" id="placeholder-map" autocomplete="off" readonly />
          <input class="hide" type="text" name="evt-map" id="evt-map" autocomplete="off" readonly />
          <div class="btn btn-find find-coor">Select map and tile</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="f p">
          <div class="i">
            <div class="inp">
              <label for="evt-x">*Destination X</label>
              <input type="text" name="evt-x" id="evt-x" autocomplete="off" placeholder="x (on grid)" required />
            </div>
          </div>
          <div class="i">
            <div class="inp">
              <label for="evt-y">*Destination Y</label>
              <input type="text" name="evt-y" id="evt-y" autocomplete="off" placeholder="y (on grid)" required />
            </div>
          </div>
        </div>
        <div class="f p">
          <div class="btn btn-find find-coor">Select map and tile</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <p class="tx">*Facing Direction</p>
        <div class="f p">
          <div class="i">
            <div class="radio">
              <label for="evt-direction-left">
                <input type="radio" name="evt-direction" id="evt-direction-left" value="left" ${direction === "left" ? "checked " : ""}/>
                <span>Left</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-down">
                <input type="radio" name="evt-direction" id="evt-direction-down" value="down" ${direction === "down" ? "checked " : ""} />
                <span>Down</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-right">
                <input type="radio" name="evt-direction" id="evt-direction-right" value="right" ${direction === "right" ? "checked " : ""}/>
                <span>Right</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-up">
                <input type="radio" name="evt-direction" id="evt-direction-up" value="up" ${direction === "up" ? "checked" : ""} />
                <span>Up</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="check">
          <label for="evt-door">
            <input type="checkbox" name="evt-door" id="evt-door" value="true" ${door ? "checked " : ""}/>
            <span>Play Door Sound On Map Changing</span>
          </label>
        </div>
      </div>
    </div>`

    const mapBefore = event.editor.currentMap

    const updateData = (s?: { newX?: number; newY?: number; newMap?: string }) => {
      const x = (s?.newX ?? itm?.x)?.toString() || ""
      const y = (s?.newY ?? itm?.y)?.toString() || ""
      const map = s?.newMap || itm?.map || ""
      const mapName = map && work[map]?.name ? work[map].name : "- No Map Selected"

      const inpMapName = futor("#placeholder-map", child) as HTMLInputElement
      inpMapName.value = mapName

      const inpMapId = futor("#evt-map", child) as HTMLInputElement
      inpMapId.value = map

      const inpX = futor("#evt-x", child) as HTMLInputElement
      inpX.value = x

      const inpY = futor("#evt-y", child) as HTMLInputElement
      inpY.value = y
    }

    const btnCoors = child.querySelectorAll(".find-coor") as NodeListOf<HTMLDivElement>
    btnCoors.forEach((btn) => {
      btn.onclick = () => {
        if (isLocked) return
        isLocked = true

        event.hide()
        event.lock()

        const editorPrompt = new EditorPrompted(event.editor, "Select any map and tile")
        editorPrompt.start()

        event.editor.mapToBack(mapBefore!)

        event.editor.findTile((x, y, map) => {
          isLocked = false
          event.hide(false)
          event.lock(false)
          editorPrompt.end()

          const statMid = !event.editor.middle.locked
          const statTop = !event.editor.top.locked
          const statBtm = !event.editor.bottom.locked

          event.editor.middle.lock(false)
          event.editor.top.lock(false)
          event.editor.bottom.lock(false)

          event.editor.startMap(mapBefore!)
          event.editor.mapToBack(null)

          event.editor.middle.lock(!statMid)
          event.editor.top.lock(!statTop)
          event.editor.bottom.lock(!statBtm)

          if (typeof x === "number" && typeof y === "number" && map) {
            updateData({ newX: x, newY: y, newMap: map })
          }
        })
      }
    })

    updateData()

    return child
  },
  addStates(_, itm) {
    const states = itm?.states?.join(", ") || ""
    const text = itm?.text?.id ? `${itm.text.id} \\ ${itm.text.en}` : ""

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-states">*States <small>- separate with comma </small></label>
          <input type="text" name="evt-states" id="evt-states" placeholder="ex: COMPUTER_OFF, KEY_TAKEN" value="${states}" autocomplete="off" required />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-text"><small>(Optional)</small> Chat Box Text <small>- separate language with \\ (id\\en) </small></label>
          <input type="text" name="evt-text" id="evt-text" placeholder="ex: mematikan komputer \\ turned off the computer" value="${text}" autocomplete="off" />
        </div>
      </div>
    </div>`
    return childs
  },
  addClaims(_, itm) {
    const states = itm?.states?.join(", ") || ""

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-states">*States <small>- separate with comma </small></label>
          <input type="text" name="evt-states" id="evt-states" placeholder="ex: COMPUTER_OFF, KEY_TAKEN" value="${states}" autocomplete="off" required />
        </div>
      </div>
    </div>`
    return childs
  },
  removeStates(_, itm) {
    const states = itm?.states?.join(", ") || ""

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-states">*States <small>- separate with comma </small></label>
          <input type="text" name="evt-states" id="evt-states" placeholder="ex: COMPUTER_OFF, KEY_TAKEN" value="${states}" autocomplete="off" required />
        </div>
      </div>
    </div>`
    return childs
  },
  addHint(_, itm) {
    const id = itm?.id || ""
    const text = itm?.text?.id ? `${itm.text.id} \\ ${itm.text.en}` : ""
    const states = itm?.states?.join(", ") || ""
    const idx = itm?.idx || 0
    const optional = itm?.instant || false

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-id">*Hint ID</label>
          <input type="text" name="evt-id" id="evt-id" placeholder="ex: hint420" autocomplete="off" value="${id}" required />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-text">*Text <small>- separate language with \\ (id\\en)</small></label>
          <textarea name="evt-text" id="evt-text" placeholder="ex: Temukan air untuk diisikan ke botol \\ Find water to fill your bottle" autocomplete="off" required>${text}</textarea>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-states">*State <small>Requirements to unlock this hint - separate with comma</small></label>
          <input type="text" name="evt-states" id="evt-states" placeholder="ex: FILLED_BOTTLE, WATER_MAX" autocomplete="off" value="${states}" required />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-idx">*Index <small>- sort with the others</small></label>
          <input type="number" name="evt-idx" id="evt-idx" placeholder="ex: 69" autocomplete="off" value="${idx}" required />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="check">
          <label for="evt-instant">
            <input type="checkbox" name="evt-instant" id="evt-instant" value="true" ${optional ? "checked " : ""}/>
            <span>Set the hint as optional</span>
          </label>
        </div>
      </div>
    </div>`
    return childs
  },
  addItem(event, itm) {
    const amount = itm?.amount || ""

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="placeholder-item">*Item</label>
          <input type="text" name="placeholder-item" id="placeholder-item" autocomplete="off" readonly />
          <input class="hide" type="text" name="evt-id" id="evt-id" autocomplete="off" readonly />
          <div class="btn btn-find find-coor">Select from your custom item list</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-amount">*Amount</label>
          <input type="number" name="evt-amount" id="evt-amount" placeholder="ex: 69" autocomplete="off" value="${amount}" required />
        </div>
      </div>
    </div>`

    const updateData = (item?: ICloudItem) => {
      const itemName = (item?.name || db.items.find((k) => k.id === itm?.id)?.name)?.en || "- No Item Selected"
      const itemId = item?.id || itm?.id || ""
      const inpItemName = futor("#placeholder-item", child) as HTMLInputElement
      inpItemName.value = itemName

      const inpItemId = futor("#evt-id", child) as HTMLInputElement
      inpItemId.value = itemId
    }

    const btnFind = futor(".find-coor", child)
    btnFind.onclick = () => {
      if (isLocked) return
      isLocked = true

      event.hide()
      event.lock()

      const editorItems = new EditorItems(event.editor, true)
      editorItems.onDone((newItem) => {
        isLocked = false
        event.hide(false)
        event.lock(false)
        updateData(newItem)
      })
      editorItems.init()
    }

    updateData()

    return child
  },
  teleport(event, itm) {
    const direction = itm?.direction || "down"

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="placeholder-who">*Object/Person</label>
          <input type="text" name="placeholder-who" id="placeholder-who" autocomplete="off" readonly />
          <input class="hide" type="text" name="evt-who" id="evt-who" autocomplete="off" readonly />
          <div class="btn btn-find find-object">Select Object/Person</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="f p">
          <div class="i">
            <div class="inp">
              <label for="evt-x">*Destination X</label>
              <input type="text" name="evt-x" id="evt-x" autocomplete="off" placeholder="x (on grid)" required />
            </div>
          </div>
          <div class="i">
            <div class="inp">
              <label for="evt-y">*Destination Y</label>
              <input type="text" name="evt-y" id="evt-y" autocomplete="off" placeholder="y (on grid)" required />
            </div>
          </div>
        </div>
        <div class="f p">
          <div class="btn btn-find find-coor">Select destination tile</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <p class="tx">*Facing Direction</p>
        <div class="f p">
          <div class="i">
            <div class="radio">
              <label for="evt-direction-left">
                <input type="radio" name="evt-direction" id="evt-direction-left" value="left" ${direction === "left" ? "checked " : ""}/>
                <span>Left</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-down">
                <input type="radio" name="evt-direction" id="evt-direction-down" value="down" ${direction === "down" ? "checked " : ""}/>
                <span>Down</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-right">
                <input type="radio" name="evt-direction" id="evt-direction-right" value="right" ${direction === "right" ? "checked " : ""}/>
                <span>Right</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-up">
                <input type="radio" name="evt-direction" id="evt-direction-up" value="up" ${direction === "up" ? "checked " : ""}/>
                <span>Up</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>`

    const mapBefore = event.editor.currentMap

    const updateCoor = (s?: { newWho?: string; newX?: number; newY?: number }) => {
      const x = (s?.newX ?? itm?.x)?.toString() || ""
      const y = (s?.newY ?? itm?.y)?.toString() || ""

      const inpX = futor("#evt-x", child) as HTMLInputElement
      inpX.value = x

      const inpY = futor("#evt-y", child) as HTMLInputElement
      inpY.value = y
    }

    const updateObject = (newWho?: string) => {
      const who = newWho || itm?.who || ""
      const whoName = objectList.find(who)?.object.name || "- No Object Found"

      const inpWhoName = futor("#placeholder-who", child) as HTMLInputElement
      inpWhoName.value = whoName

      const inpWhoId = futor("#evt-who", child) as HTMLInputElement
      inpWhoId.value = who
    }

    const btnCoor = futor(".find-coor", child) as HTMLDivElement
    btnCoor.onclick = () => {
      if (isLocked) return

      const tpOriIdx = event.itms?.findIndex((k) => k.n === itm?.n) ?? -1
      const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

      const changeMaps = event.itms?.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
      const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : undefined

      if (changeMap) {
        const statMid = !event.editor.middle.locked
        const statTop = !event.editor.top.locked
        const statBtm = !event.editor.bottom.locked

        event.editor.middle.lock(false)
        event.editor.top.lock(false)
        event.editor.bottom.lock(false)

        event.editor.startMap(changeMap!)

        event.editor.middle.lock(!statMid)
        event.editor.top.lock(!statTop)
        event.editor.bottom.lock(!statBtm)
      }

      isLocked = true

      event.hide()
      event.lock()

      const editorPrompt = new EditorPrompted(event.editor, "Select 1 tile on current map")
      editorPrompt.start()

      event.editor.findTile((x, y, map) => {
        isLocked = false
        event.hide(false)
        event.lock(false)
        editorPrompt.end()

        const statMid = !event.editor.middle.locked
        const statTop = !event.editor.top.locked
        const statBtm = !event.editor.bottom.locked

        event.editor.middle.lock(false)
        event.editor.top.lock(false)
        event.editor.bottom.lock(false)

        event.editor.startMap(mapBefore!)
        event.editor.mapToBack(null)

        event.editor.middle.lock(!statMid)
        event.editor.top.lock(!statTop)
        event.editor.bottom.lock(!statBtm)

        if (typeof x === "number" && typeof y === "number" && map) {
          updateCoor({ newX: x, newY: y })
        }
      })
    }

    const btnObject = futor(".find-object", child) as HTMLDivElement
    btnObject.onclick = () => {
      if (isLocked) return
      isLocked = true

      event.hide()
      event.lock()

      const tpOriIdx = event.itms?.findIndex((k) => k.n === itm?.n) ?? -1
      const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

      const changeMaps = event.itms?.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
      const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : event.editor.curMap

      const editorObject = new EditorObjects({ editor: event.editor, isPicker: true })

      editorObject.onDone((s) => {
        isLocked = false
        event.hide(false)
        event.lock(false)

        if (s) updateObject(s.id)
      })

      editorObject.init(changeMap || event.editor.curMap)
      editorObject.noChange = true
    }

    updateCoor()
    updateObject()

    return child
  },
  choices(_, itm) {
    const name = itm?.name?.id ? `${itm.name.id} \\ ${itm.name.en}` : ""
    const text = itm?.text?.id ? `${itm.text.id} \\ ${itm.text.en}` : ""

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-name"><small>(Optional)</small> Name <small>- separate language with \\ (id\\en)</small></label>
          <input type="text" name="evt-name" id="evt-name" placeholder="Pak Rudi \\ Mr. Elarion Lumea" autocomplete="off" maxlength="200" value="${name}" />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-text">*Text <small>- separate language with \\ (id\\en)</small></label>
          <textarea name="evt-text" id="evt-text" autocomplete="off" maxlength="3000" placeholder="Ambilin buku dulu gih \\ Bring me the book" required>${text}</textarea>
        </div>
      </div>
    </div>

    <div class="f">
      <p class="tx">Options <small>- separate language with \\ (id\\en)</small></p>
    </div>
    <div class="group group-options"></div>
    <div class="f">
      <div class="i">
        <div class="btn btn-add-field"><i class="fa-solid fa-plus"></i> Add Option</div>
      </div>
    </div>`

    const optPlaceholder = ["Oke, siap! \\ Yes, boss!", "Gimana ya \\ Lemme think"]

    const optCard = (fieldId: string, opt?: Partial<IChoiceOption>): HTMLDivElement => {
      const field = kel("div", "f")
      field.innerHTML = `
        <div class="i">
          <div class="inp">
            <input type="text" name="evt-options-text-${fieldId}" id="evt-options-text-${fieldId}" placeholder="${optPlaceholder[fieldId === "default" ? 0 : 1]}" autocomplete="off" maxlength="500" value="${opt?.text ? opt.text.id + " \\ " + opt.text.en : ""}" required />
          </div>
          <div class="f p">
            <div class="i">
              <div class="check">
                <label for="evt-options-cancel-${fieldId}">
                  <input type="checkbox" name="evt-options-cancel-${fieldId}" id="evt-options-cancel-${fieldId}" value="true" ${opt?.pass ? "checked " : ""}/>
                  <span>Fire Next Event</span>
                </label>
              </div>
            </div>
            <div class="i i-rem">
              <div class="rem">
                <div class="btn btn-remove">
                  <i class="fa-solid fa-trash-can"></i>
                </div>
              </div>
            </div>
          </div>
        </div>`

      const btnDelete = futor(".btn-remove", field)
      btnDelete.onclick = () => field.remove()

      const fieldRem = futor(".i-rem", field)
      if (fieldId === "default") fieldRem.remove()

      return field
    }

    const groups = futor(".group-options", child)

    itm?.options?.forEach((opt, i) => {
      const card = optCard(i === 0 ? "default" : genStringId() + i, opt)
      groups.append(card)
    })

    if (!itm?.options || itm.options.length < 1) {
      groups.append(optCard("default", { pass: true }), optCard(genStringId()))
    }

    const btnAdd = futor(".btn-add-field", child)
    btnAdd.onclick = () => groups.append(optCard(genStringId()))

    return child
  },
  walk(event, itm) {
    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="groups">
    </div>
    <div class="f">
      <div class="i">
        <div class="btn btn-add-field"><i class="fa-solid fa-plus"></i> Add Simultaneosly Walk Person</div>
      </div>
    </div>`

    const walkEvents: IWalk[] = itm?.walk || [{}]

    const groups = futor(".groups", child)

    const updatePerson = async (fieldId: string, newWho?: string) => {
      const who = newWho || itm?.who || ""

      const whoObj = objectList.find(who)?.object
      if (whoObj && whoObj.type !== "Person") {
        isLocked = true
        event.hide(true)
        event.lock(true)
        await modal.alert("Event walk can only be set to a Person Object")
        isLocked = false
        event.hide(false)
        event.lock(false)
        return
      }
      const whoName = whoObj?.name || "- No Person Found"

      const inpWhoName = futor(`#placeholder-who-${fieldId}`, groups) as HTMLInputElement
      inpWhoName.value = whoName

      const inpWhoId = futor(`#evt-who-${fieldId}`, groups) as HTMLInputElement
      inpWhoId.value = who
    }

    const createPersonCard = (fieldId: string, walkEvent: IWalk) => {
      const direction = walkEvent.direction || "down"

      const fieldPerson = kel("div", "f")
      fieldPerson.innerHTML = `
      <div class="i">
        <div class="inp">
          <label for="placeholder-who-${fieldId}">*Person</label>
          <input type="text" name="placeholder-who-${fieldId}" id="placeholder-who-${fieldId}" autocomplete="off" readonly />
          <input class="hide" type="text" name="evt-who-${fieldId}" id="evt-who-${fieldId}" autocomplete="off" readonly />
          <div class="btn btn-find find-person">Select Person</div>
        </div>
      </div>`

      const fieldDir = kel("div", "f")
      fieldDir.innerHTML = `
      <div class="f">
        <div class="i">
          <p class="tx">*Walk Direction</p>
          <div class="f p">
            <div class="i">
              <div class="radio">
                <label for="evt-direction-${fieldId}-left">
                  <input type="radio" name="evt-direction-${fieldId}" id="evt-direction-${fieldId}-left" value="left" ${direction === "left" ? "checked " : ""}/>
                  <span>Left</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="evt-direction-${fieldId}-down">
                  <input type="radio" name="evt-direction-${fieldId}" id="evt-direction-${fieldId}-down" value="down" ${direction === "down" ? "checked " : ""}/>
                  <span>Down</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="evt-direction-${fieldId}-right">
                  <input type="radio" name="evt-direction-${fieldId}" id="evt-direction-${fieldId}-right" value="right" ${direction === "right" ? "checked " : ""}/>
                  <span>Right</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="evt-direction-${fieldId}-up">
                  <input type="radio" name="evt-direction-${fieldId}" id="evt-direction-${fieldId}-up" value="up" ${direction === "up" ? "checked " : ""}/>
                  <span>Up</span>
                </label>
              </div>
            </div>
          </div>
          <div class="f p i-rem">
            <div class="rem">
              <div class="btn btn-remove">
                <i class="fa-solid fa-trash-can"></i>
              </div>
            </div>
          </div>
        </div>
      </div>`

      const btnPerson = futor(".find-person", fieldPerson) as HTMLDivElement
      btnPerson.onclick = () => {
        if (isLocked) return
        isLocked = true

        event.hide()
        event.lock()

        const tpOriIdx = event.itms?.findIndex((k) => k.n === itm?.n) ?? -1
        const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

        const changeMaps = event.itms?.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
        const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : undefined

        const editorObject = new EditorObjects({ editor: event.editor, isPicker: true })

        editorObject.onDone((s) => {
          isLocked = false
          event.hide(false)
          event.lock(false)

          if (s) updatePerson(fieldId, s.id)
        })

        editorObject.init(changeMap || event.editor.curMap)
        editorObject.noChange = true
      }

      const btnRemove = futor(".btn-remove", fieldDir)
      btnRemove.onclick = () => {
        fieldPerson.remove()
        fieldDir.remove()
      }

      if (fieldId === "default") btnRemove.remove()

      groups.append(fieldPerson, fieldDir)

      updatePerson(fieldId, walkEvent.who)
    }

    walkEvents.forEach((k, i) => createPersonCard(i === 0 ? "default" : genStringId(), k))

    const btnAdd = futor(".btn-add-field", child)
    btnAdd.onclick = () => createPersonCard(genStringId(), {})

    return child
  },
  stand(event, itm) {
    const direction = itm?.direction || "down"
    const time = itm?.time || 1000

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="placeholder-who">*Person</label>
          <input type="text" name="placeholder-who" id="placeholder-who" autocomplete="off" readonly />
          <input class="hide" type="text" name="evt-who" id="evt-who" autocomplete="off" readonly />
          <div class="btn btn-find find-person">Select Person</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <p class="tx">*Facing Direction</p>
        <div class="f p">
          <div class="i">
            <div class="radio">
              <label for="evt-direction-left">
                <input type="radio" name="evt-direction" id="evt-direction-left" value="left" ${direction === "left" ? "checked " : ""}/>
                <span>Left</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-down">
                <input type="radio" name="evt-direction" id="evt-direction-down" value="down" ${direction === "down" ? "checked " : ""}/>
                <span>Down</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-right">
                <input type="radio" name="evt-direction" id="evt-direction-right" value="right" ${direction === "right" ? "checked " : ""}/>
                <span>Right</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-direction-up">
                <input type="radio" name="evt-direction" id="evt-direction-up" value="up" ${direction === "up" ? "checked " : ""}/>
                <span>Up</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-time">*Stand Time <small>- idle time in milliseconds</small></label>
          <input type="text" name="evt-time" id="evt-time" autocomplete="off" placeholder="ex: 1000 (means 1 second)" value="${time}" required />
        </div>
      </div>
    </div>`

    const updatePerson = async (newWho?: string) => {
      const who = newWho || itm?.who || ""

      const whoObj = objectList.find(who)?.object
      if (whoObj && whoObj.type !== "Person") {
        isLocked = true
        event.hide(true)
        event.lock(true)
        await modal.alert("Event walk can only be set to a Person Object")
        isLocked = false
        event.hide(false)
        event.lock(false)
        return
      }
      const whoName = whoObj?.name || "- No Person Found"

      const inpWhoName = futor("#placeholder-who", child) as HTMLInputElement
      inpWhoName.value = whoName

      const inpWhoId = futor("#evt-who", child) as HTMLInputElement
      inpWhoId.value = who
    }

    const btnPerson = futor(".find-person", child) as HTMLDivElement
    btnPerson.onclick = () => {
      if (isLocked) return
      isLocked = true

      event.hide()
      event.lock()

      const tpOriIdx = event.itms?.findIndex((k) => k.n === itm?.n) ?? -1
      const tpIdx = tpOriIdx === -1 ? Infinity : tpOriIdx

      const changeMaps = event.itms?.filter((k, i) => k.type === "changeMap" && i <= tpIdx).map((k) => k.map)
      const changeMap = changeMaps ? changeMaps[changeMaps.length - 1] : undefined

      const editorObject = new EditorObjects({ editor: event.editor, isPicker: true })

      editorObject.onDone((s) => {
        isLocked = false
        event.hide(false)
        event.lock(false)

        if (s) updatePerson(s.id)
      })

      editorObject.init(changeMap || event.editor.curMap)
      editorObject.noChange = true
    }

    updatePerson()

    return child
  },
  addLocalFlags(_, itm) {
    const states = itm?.states?.join(", ") || ""
    const text = itm?.text?.id ? `${itm.text.id} \\ ${itm.text.en}` : ""

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-states">*States <small>- separate with comma </small></label>
          <input type="text" name="evt-states" id="evt-states" placeholder="ex: COMPUTER_OFF, KEY_TAKEN" value="${states}" autocomplete="off" required />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-text"><small>(Optional)</small> Chat Box Text <small>- separate language with \\ (id\\en) </small></label>
          <input type="text" name="evt-text" id="evt-text" placeholder="ex: mematikan komputer \\ turned off the computer" value="${text}" autocomplete="off" />
        </div>
      </div>
    </div>`
    return childs
  },
  removeLocalFlags(_, itm) {
    const states = itm?.states?.join(", ") || ""

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-states">*States <small>- separate with comma </small></label>
          <input type="text" name="evt-states" id="evt-states" placeholder="ex: COMPUTER_OFF, KEY_TAKEN" value="${states}" autocomplete="off" required />
        </div>
      </div>
    </div>`
    return childs
  },
  customEvent(_itm) {
    const childs = `
    <div class="f">
      <p class="tx center">Choose Between Your Custom Events</p>
    </div>
    <div class="f">
      <div class="i">
        <div class="f p">
          <div class="i">
            <div class="radio">
              <label for="evt-id-example">
                <input type="radio" name="evt-id" id="evt-id-example" value="example" required />
                <span>Example Event</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="f">
      <p class="tx center">You can create your own events by modifying the custom scripts<br /><small class="by"><i class="fa-solid fa-gear"></i> Game Settings &gt; Custom Scritps</small><br /> Good Luck :)</p>
    </div>`
    return childs
  },
  backsongControl(_, itm) {
    const action = itm?.action || "pause"

    const childs = `
    <div class="f">
      <p class="tx center">Control The Background Music</p>
    </div>
    <div class="f">
      <div class="i">
        <div class="radio">
          <label for="evt-action-pause">
            <input type="radio" name="evt-action" id="evt-action-pause" value="pause" ${action === "pause" ? "checked " : ""} />
            <span>Pause</span>
          </label>
        </div>
      </div>
      <div class="i">
        <div class="radio">
          <label for="evt-action-resume">
            <input type="radio" name="evt-action" id="evt-action-resume" value="resume" ${action === "resume" ? "checked " : ""} />
            <span>Resume</span>
          </label>
        </div>
      </div>
      <div class="i">
        <div class="radio">
          <label for="evt-action-previous">
            <input type="radio" name="evt-action" id="evt-action-previous" value="previous" ${action === "previous" ? "checked " : ""} />
            <span>Previous</span>
          </label>
        </div>
      </div>
      <div class="i">
        <div class="radio">
          <label for="evt-action-next">
            <input type="radio" name="evt-action" id="evt-action-next" value="next" ${action === "next" ? "checked " : ""} />
            <span>Next</span>
          </label>
        </div>
      </div>
    </div>`
    return childs
  },
  playSound(event, itm) {
    const instant = itm?.instant || false

    const which = itm?.which || "sfx"

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="placeholder-src">*Audio Source</label>
          <input type="text" name="placeholder-src" id="placeholder-src" autocomplete="off" readonly />
          <input class="hide" type="text" name="evt-src" id="evt-src" autocomplete="off" readonly />
          <div class="audio-preview" x-found="evt-src"></div>
          <div class="btn btn-find find-src">Select audio file</div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <p class="tx">*Audio Type</p>
        <div class="f p">
          <div class="i">
            <div class="radio">
              <label for="evt-which-sfx">
                <input type="radio" name="evt-which" id="evt-which-sfx" value="sfx" ${which === "sfx" ? "checked " : ""} />
                <span>SFX</span>
              </label>
            </div>
          </div>
          <div class="i">
            <div class="radio">
              <label for="evt-which-ui">
                <input type="radio" name="evt-which" id="evt-which-ui" value="ui" ${which === "ui" ? "checked " : ""} />
                <span>UI</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="check">
          <label for="evt-instant">
            <input type="checkbox" name="evt-instant" id="evt-instant" value="true" ${instant ? "checked " : ""} />
            <span>Fire next event without waiting for the audio to ended</span>
          </label>
        </div>
      </div>
    </div>`

    const updateSource = async (srcId?: string) => {
      const src = srcId || itm?.src || ""
      const srcFile = db.assets.find((file) => file.id === src)

      if (srcFile && srcFile.type !== "audio") {
        isLocked = true
        event.lock()
        event.hide()

        await modal.alert("File must be an audio file")

        isLocked = false
        event.lock(false)
        event.hide(false)

        return
      }

      const srcName = srcFile?.name || "- No Audio Selected"

      const inpSrcName = futor("#placeholder-src", child) as HTMLInputElement
      inpSrcName.value = srcName

      const inpSrcId = futor("#evt-src", child) as HTMLInputElement
      inpSrcId.value = src

      if (srcFile) {
        const audioPreview = futor('[x-found="evt-src"]', child)
        while (audioPreview.firstChild) {
          audioPreview.firstChild.remove()
        }

        const audio = new Audio()
        audio.src = sound[src].src
        audio.controls = true
        audio.innerHTML = "Your browser does not support the audio element."

        audioPreview.append(audio)
      }
    }

    const btnSrc = futor(".find-src", child)
    btnSrc.onclick = () => {
      if (isLocked) return

      isLocked = true
      event.lock()
      event.hide()

      const filePicker = new FilePicker({ sys: event.editor.middle.sys })
      filePicker.onChosen((s) => {
        isLocked = false
        event.lock(false)
        event.hide(false)

        if (s) updateSource(s)
      })

      filePicker.init()
    }

    updateSource()

    return child
  },
  addNote(_, itm) {
    const name = itm?.name?.id ? `${itm.name.id} \\ ${itm.name.en}` : ""

    const child = kel("div", "groups group-renderer")
    child.innerHTML = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-name">*Note Name <small>- separate language with \\ (id\\en)</small></label>
          <input type="text" name="evt-name" id="evt-name" placeholder="Catatan dari Rudi \\ Note from Elarion Lumea" autocomplete="off" maxlength="200" value="${name}" required />
        </div>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <p class="tx">*Content <small>- separate language with \\ (id\\en)</small></p>
      </div>
    </div>
    <div class="group group-pages"></div>
    <div class="f">
      <div class="i center">
        <p><small>Use *asterisk* to mark it as a Point of Interest</small></p>
        <p><small>Use <span class="by">asterisk</span> to mark it as a Point of Interest</small></p>
      </div>
    </div>
    <div class="f">
      <div class="i">
        <div class="f p">
          <p class="txt center pagenum">1 Page(s)</p>
        </div>
        <div class="f p">
          <div class="btn btn-add-field"><i class="fa-solid fa-plus"></i> Add Page</div>
        </div>
      </div>
    </div>`

    let pageNum = 0

    const updateNum = (addedNum: number) => {
      const p = futor(".pagenum", child)
      pageNum = pageNum + addedNum
      p.innerHTML = `${pageNum} Page(s)`
    }

    const pageCard = (fieldId: string, page?: ILocale): HTMLDivElement => {
      const field = kel("div", "f")
      field.innerHTML = `
      <div class="i">
        <div class="inp">
          <textarea name="evt-pages-${fieldId}" id="evt-pages-${fieldId}" autocomplete="off" maxlength="8192" placeholder="Aku menulis surat ini dari jarak *3000km* \\ I wrote this letter from *3000km* away" required>${page ? page.id + " \\ " + page.en : ""}</textarea>
        </div>
        <div class="f p i-rem">
          <div class="rem">
            <div class="btn btn-remove">
              <i class="fa-solid fa-trash-can"></i>
            </div>
          </div>
        </div>
      </div>`

      const btnDelete = futor(".btn-remove", field)
      btnDelete.onclick = () => {
        field.remove()
        updateNum(-1)
      }

      const fieldRem = futor(".i-rem", field)
      if (fieldId === "default") fieldRem.remove()

      updateNum(1)

      return field
    }

    const groups = futor(".group-pages", child)

    itm?.pages?.forEach((page, i) => {
      const card = pageCard(i === 0 ? "default" : genStringId() + i, page)
      groups.append(card)
    })

    if (!itm?.pages || itm.pages.length < 1) groups.append(pageCard("default"))

    const btnAdd = futor(".btn-add-field", child)
    btnAdd.onclick = () => groups.append(pageCard(genStringId()))

    return child
  },
  objectives(_, itm) {
    const text = itm?.text?.id ? `${itm.text.id} \\ ${itm.text.en}` : ""

    const childs = `
    <div class="f">
      <div class="i">
        <div class="inp">
          <label for="evt-text">Text <small>- separate language with \\ (id\\en)</small></label>
          <input type="text" name="evt-text" id="evt-text" placeholder="Curi *mobil* di garasi \\ Steal a *car* in the garage" autocomplete="off" maxlength="600" value="${text}" />
        </div>
        <p class="tx">(^) leave empty to remove active objectives</p>
      </div>
    </div>
    <div class="f">
      <div class="i center">
        <p>Use *asterisk* to mark it as a Point of Interest</p>
        <p>Use <span class="cy">asterisk</span> to mark it as a Point of Interest</p>
      </div>
    </div>`
    return childs
  },
  removeObjectives(_, __) {
    const childs = `
    <br/>
    <div class="f">
      <div class="i">
        <div class="tx center">Remove active objectives?</div>
      </div>
    </div>
    <br/>`
    return childs
  },
  payout(_, __) {
    const childs = `
    <br/>
    <div class="f">
      <div class="i">
        <div class="tx center">Set all players in the session to play the mission completed events and receiving the payout</div>
      </div>
    </div>
    <br/>`
    return childs
  },
  jumpscare(_, __) {
    const childs = `
    <br/>
    <div class="f">
      <div class="i">
        <div class="tx center">Just to spawn a ghost and walk them across the screen in a few seconds</div>
      </div>
    </div>
    <br/>`
    return childs
  },
  readnote(_, __) {
    const childs = `
    <br/>
    <div class="f">
      <div class="i">
        <div class="tx center">Just to immediately reading the note for the current player</div>
      </div>
    </div>
    <br/>`
    return childs
  }
}
