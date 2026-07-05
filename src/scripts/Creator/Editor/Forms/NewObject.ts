import { eroot, futor, qutor } from "../../../lib/kel"
import modal from "../../../lib/modal"
import { IAny } from "../../../types/LibTypes"
import { work } from "../../data/work"
import { Editor } from "../../Editor"
import { DirectionType, GameObjectType, IGameObjectData } from "../../types/CreatorTypes"
import { genStringId, toObject } from "../../lib/gen"
import { EditorPrompted } from "../Parts/Sys/EditorPrompted"
import { FilePicker } from "./FilePicker"
import { ICutsceneToReturn, NewCutscene } from "./NewCutscene"
import { SpritePreview } from "./SpritePreview"
import { iform } from "./TemplateForm"

export interface INewObjectForm {
  name: string
  x: string
  y: string
  type: string
  direction: string
  health: string
  behavior: string
  shadow: string
  collisionx: string
  collisiony: string
  collisionw: string
  collisionh: string
  frames: string
  states: string
  statetype: string
}

export class NewObject {
  locked: boolean = false
  private el!: HTMLFormElement
  editor: Editor

  private overWrite: boolean = false

  protected onSubmission?: (s?: IAny, isDeleted?: boolean) => IAny
  private itm: IGameObjectData

  private sprite?: SpritePreview

  constructor(x: number, y: number, editor: Editor) {
    this.editor = editor

    this.itm = {
      id: genStringId(),
      type: "Interactable",
      x,
      y
    }

    const cobj = work[editor.curMap!].configObjects
    const obj = Object.keys(cobj).find((k) => cobj[k].x === x && cobj[k].y === y)

    if (obj) {
      this.overWrite = true
      this.itm = toObject(cobj[obj])
    }
  }
  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">${this.overWrite ? "Update" : "New"} Object</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label for="obj-name">Object Name</label>
            <input type="text" name="obj-name" id="obj-name" placeholder="Sawit Kehidupan" />
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="inp">
            <label for="obj-x">*X</label>
            <input type="number" name="obj-x" id="obj-x" placeholder="x (on grid)" />
          </div>
        </div>
        <div class="i">
          <div class="inp">
            <label for="obj-y">*Y</label>
            <input type="number" name="obj-y" id="obj-y" placeholder="y (on grid)" />
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="btn btn-find find-coor">Select from tile</div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx">*Object Type</p>
          <div class="f p">
            <div class="i">
              <div class="radio">
                <label for="obj-type-Person">
                  <input type="radio" name="obj-type" id="obj-type-Person" value="Person" />
                  <span>Person</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-type-Interactable">
                  <input type="radio" name="obj-type" id="obj-type-Interactable" value="Interactable" />
                  <span>Interactable</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-type-Prop">
                  <input type="radio" name="obj-type" id="obj-type-Prop" value="Prop" />
                  <span>Prop</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx">Assign Shadow</p>
          <div class="f p">
            <div class="i">
              <div class="radio">
                <label for="obj-shadow-true">
                  <input type="radio" name="obj-shadow" id="obj-shadow-true" value="true" />
                  <span>Use Shadow</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-shadow-false">
                  <input type="radio" name="obj-shadow" id="obj-shadow-false" value="false" />
                  <span>No Shadow</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx center">*Image Source</p>
          <div class="img" x-found="obj-src"></div>
          <div class="btn btn-find find-src" x-find="obj-src">Choose Your Asset</div>
        </div>
      </div>
      <div class="f uq-person hide">
        <div class="i">
          <p class="tx">*Facing Direction</p>
          <div class="f p">
            <div class="i">
              <div class="radio">
                <label for="obj-direction-left">
                  <input type="radio" name="obj-direction" id="obj-direction-left" value="left" />
                  <span>Left</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-direction-down">
                  <input type="radio" name="obj-direction" id="obj-direction-down" value="down" />
                  <span>Down</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-direction-right">
                  <input type="radio" name="obj-direction" id="obj-direction-right" value="right" />
                  <span>Right</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-direction-up">
                  <input type="radio" name="obj-direction" id="obj-direction-up" value="up" />
                  <span>Up</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f uq-person hide">
        <div class="i">
          <div class="inp">
            <label for="obj-health">Health <small>dealt 30-40/hit </small></label>
            <input type="text" name="obj-health" id="obj-health" placeholder="100" />
          </div>
        </div>
      </div>
      <div class="f uq-person hide">
        <div class="i">
          <p class="tx">Behavior</p>
          <div class="f p">
            <div class="i">
              <div class="radio">
                <label for="obj-behavior-none">
                  <input type="radio" name="obj-behavior" id="obj-behavior-none" value="none" />
                  <span>None</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-behavior-following">
                  <input type="radio" name="obj-behavior" id="obj-behavior-following" value="following" />
                  <span>Following</span>
                </label>
              </div>
            </div>
            <div class="i">
              <div class="radio">
                <label for="obj-behavior-enemy">
                  <input type="radio" name="obj-behavior" id="obj-behavior-enemy" value="enemy" />
                  <span>Enemy</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f uq-object hide">
        <div class="groups">
          <p class="tx">Relative position to collision box <small class="mono">/tile%</small></p>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="obj-collisionx">StartX</label>
                <input type="number" name="obj-collisionx" id="obj-collisionx" placeholder="0" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="obj-collisiony">StartY</label>
                <input type="number" name="obj-collisiony" id="obj-collisiony" placeholder="0" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="obj-collisionw">Width</label>
                <input type="number" name="obj-collisionw" id="obj-collisionw" placeholder="1" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="obj-collisionh">Height</label>
                <input type="number" name="obj-collisionh" id="obj-collisionh" placeholder="1" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="f uq-object hide">
        <div class="i">
          <div class="inp">
            <label for="obj-frames">Loop Frames Length</label>
            <input type="number" name="obj-frames" id="obj-frames" placeholder="Number of Sprites" />
          </div>
        </div>
      </div>
      <div class="f uq-object hide">
        <div class="i">
          <div class="inp">
            <label for="obj-states">Play 2nd Animation If Has These Flags</label>
            <input type="text" name="obj-states" id="obj-states" placeholder="TV_TURNED_ON, REMOTE_PRESSED" />
          </div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx">Talk/Interaction Events</p>
          <div class="img" x-found="obj-talk"></div>
          <div class="btn btn-find find-talk" x-find="obj-talk">Open Events Panel</div>
        </div>
      </div>
      <div class="f uq-person hide">
        <div class="i">
          <p class="tx">Person Defeat Events</p>
          <div class="img" x-found="obj-defeat"></div>
          <div class="btn btn-find find-defeat" x-find="obj-defeat">Open Events Panel</div>
        </div>
      </div>
      <div class="f">
        <div class="s field-delete${this.overWrite ? "" : " hide"}">
          <div class="btn btn-delete-object">Delete</div>
        </div>
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>`)
  }
  private writeData(): void {
    const inpName = futor("#obj-name", this.el) as HTMLInputElement
    inpName.value = this.itm?.name || ""

    const inpX = futor("#obj-x", this.el) as HTMLInputElement
    inpX.value = this.itm?.x?.toString() || ""

    const inpY = futor("#obj-y", this.el) as HTMLInputElement
    inpY.value = this.itm?.y?.toString() || ""

    const inpType = qutor(`#obj-type-${this.itm?.type || "Interactable"}`, this.el) as HTMLInputElement
    if (inpType) inpType.checked = true

    const inpDirection = qutor(`#obj-direction-${this.itm?.direction || "down"}`, this.el) as HTMLInputElement
    if (inpDirection) inpDirection.checked = true

    const inpHealth = futor("#obj-health", this.el) as HTMLInputElement
    inpHealth.value = this.itm?.health?.toString() || ""

    let inpBehaviorId = "none"
    if (this.itm?.enemy) {
      inpBehaviorId = "enemy"
    } else if (this.itm?.following) {
      inpBehaviorId = "following"
    }

    const inpBehavior = futor(`#obj-behavior-${inpBehaviorId}`, this.el) as HTMLInputElement
    inpBehavior.checked = true

    const useShadow = this.itm?.shadow || (this.itm?.type === "Person" && typeof this.itm.shadow === "undefined")

    const inpShadow = futor(`#obj-shadow-${useShadow ? "true" : "false"}`, this.el) as HTMLInputElement
    inpShadow.checked = true

    const inpCollisionX = futor("#obj-collisionx", this.el) as HTMLInputElement
    inpCollisionX.value = this.itm?.collision?.[0].toString() || "0"

    const inpCollisionY = futor("#obj-collisiony", this.el) as HTMLInputElement
    inpCollisionY.value = this.itm?.collision?.[1].toString() || "0"

    const inpCollisionW = futor("#obj-collisionw", this.el) as HTMLInputElement
    inpCollisionW.value = this.itm?.collision?.[2].toString() || "1"

    const inpCollisionH = futor("#obj-collisionh", this.el) as HTMLInputElement
    inpCollisionH.value = this.itm?.collision?.[3].toString() || "1"

    const inpFrame = futor("#obj-frames", this.el) as HTMLInputElement
    inpFrame.value = typeof this.itm?.offset?.[0] === "number" ? this.itm.offset[0].toString() : "1"

    const inpStates = futor("#obj-states", this.el) as HTMLInputElement
    inpStates.value = this.itm?.states?.join(", ") || ""

    this.writePersonData()
  }

  private writeImagePreview(): void {
    if (this.sprite) {
      this.sprite.destroy()
      this.sprite = undefined
    }

    const fieldPreview = futor('[x-found="obj-src"]', this.el)
    while (fieldPreview.firstChild) {
      fieldPreview.firstChild.remove()
    }

    const spritePreview = new SpritePreview({
      src: this.itm.src!,
      type: this.itm.type,
      offset: this.itm.offset,
      collision: this.itm.collision
    }).init()

    this.sprite = spritePreview

    fieldPreview.append(spritePreview.canvas)
  }

  private updateImage(src: string): void {
    this.itm.src = src
    this.sprite?.updateData({ src })
  }

  private checkObjectSwitches(): void {
    const typeSwitches = this.el.querySelectorAll('[name="obj-type"]') as NodeListOf<HTMLInputElement>

    typeSwitches.forEach((inp) => {
      inp.onchange = () => {
        this.itm!.type = inp.value as GameObjectType
        this.sprite?.updateData({ type: this.itm.type })
        this.writePersonData()
      }
    })

    const inpCollisionX = futor("#obj-collisionx", this.el) as HTMLInputElement
    const inpCollisionY = futor("#obj-collisiony", this.el) as HTMLInputElement
    const inpCollisionW = futor("#obj-collisionw", this.el) as HTMLInputElement
    const inpCollisionH = futor("#obj-collisionh", this.el) as HTMLInputElement

    const inpCollisions = [inpCollisionX, inpCollisionY, inpCollisionW, inpCollisionH]

    const configCollision = inpCollisions.map((inp) => Number(inp.value.trim()))

    const onCollisionInput = (idx: number, inpVal: string) => {
      const val = Number(inpVal.trim())

      if (typeof val === "number" && !isNaN(val)) {
        if (idx >= 2 && val < 1) {
          configCollision[idx] = 1
        } else {
          configCollision[idx] = val
        }
      } else {
        configCollision[idx] = idx < 2 ? 0 : 1
      }

      this.sprite?.updateData({ collision: configCollision })
    }

    inpCollisions.forEach((inp, i) => (inp.oninput = () => onCollisionInput(i, inp.value)))

    const offset: number[] = [1, 0]

    const inpState = futor("#obj-states", this.el) as HTMLInputElement
    const inpFrame = futor("#obj-frames", this.el) as HTMLInputElement

    inpState.oninput = () => {
      const val = inpState.value.trim()
      const frameVal = inpFrame.value.trim()

      offset[0] = Number(frameVal)
      offset[1] = val.length < 1 ? 0 : 1

      this.sprite?.updateData({ offset })
    }

    inpFrame.oninput = () => {
      const val = inpFrame.value.trim()
      const stateVal = inpState.value.trim()

      offset[0] = Number(val)
      offset[1] = stateVal.length < 1 ? 0 : 1

      this.sprite?.updateData({ offset })
    }

    const btnFindImage = futor(".find-src", this.el)
    btnFindImage.onclick = () => {
      this.hide()
      const filePicker = new FilePicker({ sys: this.editor.middle.sys }).init()
      filePicker.onChosen((fileId?: string) => {
        this.hide(false)
        if (fileId) this.updateImage(fileId)
      })
    }
  }
  private writePersonData(): void {
    const isPerson = this.itm?.type === "Person"

    const fieldUniquePerson = this.el.querySelectorAll(".uq-person")
    fieldUniquePerson.forEach((field) => {
      if (!isPerson) return field.classList.add("hide")
      field.classList.remove("hide")
    })

    const fieldUniqueObject = this.el.querySelectorAll(".uq-object")
    fieldUniqueObject.forEach((field) => {
      if (!isPerson) return field.classList.remove("hide")
      field.classList.add("hide")
    })
  }
  private cutscenePanelListener(): void {
    const btnTalk = futor(".find-talk", this.el)
    btnTalk.onclick = () => {
      if (this.locked) return
      this.locked = true
      this.hide()
      const newCutscene = new NewCutscene({ editor: this.editor, type: "talk", object: this, events: toObject(this.itm.talk || []) })
      newCutscene.onDone((s?: ICutsceneToReturn, isCanceled?: boolean) => {
        this.locked = false
        if (!isCanceled && s?.cutscene) this.itm.talk = s.cutscene
        this.hide(false)
      })
      newCutscene.init()
    }

    const btnDefeat = futor(".find-defeat", this.el)
    btnDefeat.onclick = () => {
      if (this.locked) return
      this.locked = true
      this.hide()
      const newCutscene = new NewCutscene({ editor: this.editor, type: "drops", object: this, events: toObject(this.itm.drops || []) })
      newCutscene.onDone((s?: ICutsceneToReturn, isCanceled?: boolean) => {
        this.locked = false
        if (!isCanceled && s?.cutscene) this.itm.drops = s.cutscene
        this.hide(false)
      })
      newCutscene.init()
    }
  }
  private findCoor(): void {
    const btnCoor = futor(".find-coor", this.el)

    btnCoor.onclick = () => {
      if (this.locked) return
      this.locked = true

      this.hide()

      const editorPrompt = new EditorPrompted(this.editor, "Select 1 tile on current map")
      editorPrompt.start()

      this.editor.findTile((x, y) => {
        this.hide(false)
        editorPrompt.end()
        this.locked = false
        if (typeof x === "number" && typeof y === "number") this.coorFound(x, y)
      })
    }
  }
  private coorFound(x: number, y: number): void {
    this.locked = false
    this.itm.x = x
    this.itm.y = y
    this.writeData()
  }
  onDone(nextFunc: (s?: IGameObjectData, isDeleted?: boolean) => void): void {
    this.onSubmission = nextFunc
  }
  hide(newStatus: boolean = true): void {
    if (newStatus) {
      this.sprite?.destroy()
      this.el.classList.add("hide")
      return
    }
    this.sprite?.updateData({})
    this.el.classList.remove("hide")
  }
  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()

      if (this.locked) return
      this.locked = true

      const data: IGameObjectData = this.itm
      const formData = new FormData(this.el)

      const offset: number[] = [1, 0]
      const collision: number[] = [0, 0, 1, 1]

      for (const [key, val] of formData) {
        const k = key.replace("obj-", "").toString() as keyof INewObjectForm

        if (k === "x" || k === "y" || k === "health") data[k] = Number(val)

        if (k === "frames") offset[0] = Number(val)

        if (k === "collisionx") collision[0] = Number(val)
        if (k === "collisiony") collision[1] = Number(val)
        if (k === "collisionw") collision[2] = Number(val)
        if (k === "collisionh") collision[3] = Number(val)

        if (k === "type") data[k] = val as GameObjectType

        if (k === "behavior") {
          const behaviorVal = val.toString()
          if (behaviorVal === "enemy") {
            data["following"] = true
            data["enemy"] = true
          } else if (behaviorVal === "following") {
            data["following"] = true
          }
        }

        if (k === "statetype") {
          //
        }

        if (k === "shadow") data["shadow"] = val.toString() === "true"

        if (k === "states") {
          const stateList = val.toString().trim().length >= 1 ? val.toString().trim() : null
          if (stateList) {
            offset[1] = 1
            data["states"] = stateList.split(",").map((text) => text.trim())
          } else {
            delete data["states"]
          }
        }

        if (k === "direction") data["direction"] = val.toString() as DirectionType

        if (k === "name") data["name"] = val.toString().trim()
      }

      if (!data.x || !data.y) {
        await modal.alert("Data x,y is not valid")
        this.locked = false
        return
      }

      const typeList: GameObjectType[] = ["Interactable", "Person", "Prop"]
      if (!typeList.find((k) => k === data.type)) {
        await modal.alert("Data object type is not valid")
        this.locked = false
        return
      }

      if (!data.src) {
        await modal.alert("Data Image Source is not valid")
        this.locked = false
        return
      }

      data["collision"] = collision
      data["offset"] = offset

      this.locked = false

      this.destroy(data)
    }
  }
  private deleteListener(): void {
    const btnDelete = futor(".btn-delete-object", this.el)
    btnDelete.onclick = async () => {
      if (this.locked) return
      this.locked = true

      const confDelete = await modal.confirm({
        msg: "Are you sure want to unassign this object?",
        okx: "YES DO IT!",
        cancelx: "NO NO!"
      })

      if (!confDelete) {
        this.locked = false
        return
      }

      this.locked = false
      this.destroy(this.itm, true)
    }
  }
  private closeListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }
  destroy(data?: IGameObjectData, isDeleted?: boolean): void {
    if (this.locked) return

    this.el.remove()
    this.sprite?.destroy()
    if (this.onSubmission) {
      this.onSubmission(data, isDeleted)
      this.onSubmission = undefined
    }
  }
  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.closeListener()
    this.submitListener()
    this.deleteListener()
    this.writeData()
    this.checkObjectSwitches()
    this.cutscenePanelListener()
    this.findCoor()
    this.writeImagePreview()
    return this
  }
}
