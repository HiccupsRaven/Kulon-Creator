import { eroot, futor } from "../../../lib/kel"
import modal from "../../../lib/modal"
import { IAny } from "../../../types/LibTypes"
import { work } from "../../data/work"
import { Editor } from "../../Editor"
import { DirectionType, IGameObjectData, IGameObjectTeleporterType, TeleporeterFromPosition } from "../../types/CreatorTypes"
import { genStringId, toObject } from "../../lib/gen"
import { EditorPrompted } from "../Parts/Sys/EditorPrompted"

import { iform } from "./TemplateForm"

export interface INewTeleporterForm {
  name: string
  x: string
  y: string
  type: string
  from?: IGameObjectTeleporterType
}

export class NewTeleporter {
  locked: boolean = false
  private el!: HTMLFormElement
  editor: Editor

  private overWrite: boolean = false

  protected onSubmission?: (s?: IAny, isDeleted?: boolean) => IAny
  private itm: IGameObjectData

  constructor(x: number, y: number, editor: Editor) {
    this.editor = editor

    this.itm = {
      id: genStringId(),
      type: "Teleporter",
      x,
      y,
      from: {}
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
        <p class="title">${this.overWrite ? "Update" : "New"} Teleporter</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="group">
          <div class="f p">
            <div class="i">
              <p class="txt center"><b>Teleporter Position</b></p>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="tp-name">Teleporter Name</label>
                <input type="text" name="tp-name" id="tp-name" placeholder="Teleporter #69" autocomplete="off" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="tp-x">*X</label>
                <input type="number" name="tp-x" id="tp-x" placeholder="x (on grid)" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="tp-y">*Y</label>
                <input type="number" name="tp-y" id="tp-y" placeholder="y (on grid)" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="btn btn-find find-coor" x-find="position">Select tile</div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="group">
          <div class="f p">
            <div class="i">
              <p class="txt center"><b>North of the hero (up)</b></p>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <p class="tx">*Facing Direction (Destination)</p>
              <div class="f p">
                <div class="i">
                  <div class="radio">
                    <label for="tp-up-direction-left">
                      <input type="radio" name="tp-up-direction" id="tp-up-direction-left" value="left" />
                      <span>Left</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-up-direction-down">
                      <input type="radio" name="tp-up-direction" id="tp-up-direction-down" value="down" />
                      <span>Down</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-up-direction-right">
                      <input type="radio" name="tp-up-direction" id="tp-up-direction-right" value="right" />
                      <span>Right</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-up-direction-up">
                      <input type="radio" name="tp-up-direction" id="tp-up-direction-up" value="up" />
                      <span>Up</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="tp-up-x">*X (Destination)</label>
                <input type="number" name="tp-up-x" id="tp-up-x" placeholder="x (on grid)" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="tp-up-y">*Y (Destination)</label>
                <input type="number" name="tp-up-y" id="tp-up-y" placeholder="y (on grid)" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="btn btn-find find-coor" x-find="up">Select tile</div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="group">
          <div class="f p">
            <div class="i">
              <p class="txt center"><b>South of the hero (down)</b></p>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <p class="tx">*Facing Direction (Destination)</p>
              <div class="f p">
                <div class="i">
                  <div class="radio">
                    <label for="tp-down-direction-left">
                      <input type="radio" name="tp-down-direction" id="tp-down-direction-left" value="left" />
                      <span>Left</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-down-direction-down">
                      <input type="radio" name="tp-down-direction" id="tp-down-direction-down" value="down" />
                      <span>Down</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-down-direction-right">
                      <input type="radio" name="tp-down-direction" id="tp-down-direction-right" value="right" />
                      <span>Right</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-down-direction-up">
                      <input type="radio" name="tp-down-direction" id="tp-down-direction-up" value="up" />
                      <span>Up</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="tp-down-x">*X (Destination)</label>
                <input type="number" name="tp-down-x" id="tp-down-x" placeholder="x (on grid)" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="tp-down-y">*Y (Destination)</label>
                <input type="number" name="tp-down-y" id="tp-down-y" placeholder="y (on grid)" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="btn btn-find find-coor" x-find="down">Select tile</div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="group">
          <div class="f p">
            <div class="i">
              <p class="txt center"><b>West of the hero (left)</b></p>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <p class="tx">*Facing Direction (Destination)</p>
              <div class="f p">
                <div class="i">
                  <div class="radio">
                    <label for="tp-left-direction-left">
                      <input type="radio" name="tp-left-direction" id="tp-left-direction-left" value="left" />
                      <span>Left</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-left-direction-down">
                      <input type="radio" name="tp-left-direction" id="tp-left-direction-down" value="down" />
                      <span>Down</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-left-direction-right">
                      <input type="radio" name="tp-left-direction" id="tp-left-direction-right" value="right" />
                      <span>Right</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-left-direction-up">
                      <input type="radio" name="tp-left-direction" id="tp-left-direction-up" value="up" />
                      <span>Up</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="tp-left-x">*X (Destination)</label>
                <input type="number" name="tp-left-x" id="tp-left-x" placeholder="x (on grid)" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="tp-left-y">*Y (Destination)</label>
                <input type="number" name="tp-left-y" id="tp-left-y" placeholder="y (on grid)" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="btn btn-find find-coor" x-find="left">Select tile</div>
            </div>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="group">
          <div class="f p">
            <div class="i">
              <p class="txt center"><b>East of the hero (right)</b></p>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <p class="tx">*Facing Direction (Destination)</p>
              <div class="f p">
                <div class="i">
                  <div class="radio">
                    <label for="tp-right-direction-left">
                      <input type="radio" name="tp-right-direction" id="tp-right-direction-left" value="left" />
                      <span>Left</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-right-direction-down">
                      <input type="radio" name="tp-right-direction" id="tp-right-direction-down" value="down" />
                      <span>Down</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-right-direction-right">
                      <input type="radio" name="tp-right-direction" id="tp-right-direction-right" value="right" />
                      <span>Right</span>
                    </label>
                  </div>
                </div>
                <div class="i">
                  <div class="radio">
                    <label for="tp-right-direction-up">
                      <input type="radio" name="tp-right-direction" id="tp-right-direction-up" value="up" />
                      <span>Up</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="inp">
                <label for="tp-right-x">*X (Destination)</label>
                <input type="number" name="tp-right-x" id="tp-right-x" placeholder="x (on grid)" />
              </div>
            </div>
            <div class="i">
              <div class="inp">
                <label for="tp-right-y">*Y (Destination)</label>
                <input type="number" name="tp-right-y" id="tp-right-y" placeholder="y (on grid)" />
              </div>
            </div>
          </div>
          <div class="f p">
            <div class="i">
              <div class="btn btn-find find-coor" x-find="right">Select tile</div>
            </div>
          </div>
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
  private writeDefault(): void {
    const inpName = futor("#tp-name", this.el) as HTMLInputElement
    inpName.value = this.itm.name || ""

    if (!this.itm.from) this.itm.from = {}

    if (!this.itm.from.left) {
      this.itm.from.left = {
        x: this.itm.x - 1,
        y: this.itm.y,
        direction: "left"
      }
    }
    const leftDirection = this.itm.from!.left!.direction!.toString()
    const inpLeftDirection = futor(`#tp-left-direction-${leftDirection}`, this.el) as HTMLInputElement
    if (inpLeftDirection) inpLeftDirection.checked = true

    if (!this.itm.from.right) {
      this.itm.from.right = {
        x: this.itm.x + 1,
        y: this.itm.y,
        direction: "right"
      }
    }
    const rightDirection = this.itm.from!.right!.direction!.toString()
    const inpRightDirection = futor(`#tp-right-direction-${rightDirection}`, this.el) as HTMLInputElement
    if (inpRightDirection) inpRightDirection.checked = true

    if (!this.itm.from.down) {
      this.itm.from.down = {
        x: this.itm.x,
        y: this.itm.y + 1,
        direction: "down"
      }
    }
    const downDirection = this.itm.from!.down!.direction!.toString()
    const inpDownDirection = futor(`#tp-down-direction-${downDirection}`, this.el) as HTMLInputElement
    if (inpDownDirection) inpDownDirection.checked = true

    if (!this.itm.from.up) {
      this.itm.from.up = {
        x: this.itm.x,
        y: this.itm.y - 1,
        direction: "up"
      }
    }
    const upDirection = this.itm.from!.up!.direction!.toString()
    const inpUpDirection = futor(`#tp-up-direction-${upDirection}`, this.el) as HTMLInputElement
    if (inpUpDirection) inpUpDirection.checked = true
  }
  private writeData(): void {
    const inpX = futor("#tp-x", this.el) as HTMLInputElement
    inpX.value = this.itm.x.toString()

    const inpY = futor("#tp-y", this.el) as HTMLInputElement
    inpY.value = this.itm.y.toString()

    const inpLeftX = futor("#tp-left-x", this.el) as HTMLInputElement
    inpLeftX.value = this.itm.from!.left!.x.toString()

    const inpLeftY = futor("#tp-left-y", this.el) as HTMLInputElement
    inpLeftY.value = this.itm.from!.left!.y.toString()

    const inpDownX = futor("#tp-down-x", this.el) as HTMLInputElement
    inpDownX.value = this.itm.from!.down!.x.toString()

    const inpDownY = futor("#tp-down-y", this.el) as HTMLInputElement
    inpDownY.value = this.itm.from!.down!.y.toString()

    const inpRightX = futor("#tp-right-x", this.el) as HTMLInputElement
    inpRightX.value = this.itm.from!.right!.x.toString()

    const inpRightY = futor("#tp-right-y", this.el) as HTMLInputElement
    inpRightY.value = this.itm.from!.right!.y.toString()

    const inpUpX = futor("#tp-up-x", this.el) as HTMLInputElement
    inpUpX.value = this.itm.from!.up!.x.toString()

    const inpUpY = futor("#tp-up-y", this.el) as HTMLInputElement
    inpUpY.value = this.itm.from!.up!.y.toString()
  }

  private findCoor(): void {
    const btnCoors = this.el.querySelectorAll(".find-coor") as NodeListOf<HTMLDivElement>
    btnCoors.forEach((btn) => {
      const attrPos = btn.getAttribute("x-find")?.toString() || "none"
      btn.onclick = () => {
        if (this.locked) return
        this.lock()
        this.hide()
        const editorPrompt = new EditorPrompted(this.editor, "Select 1 tile on current map")
        editorPrompt.start()

        this.editor.findTile((x, y) => {
          this.hide(false)
          editorPrompt.end()
          this.lock(false)
          if (typeof x === "number" && typeof y === "number") this.coorFound(x, y, attrPos)
        })
      }
    })
  }
  private coorFound(x: number, y: number, pos: keyof IGameObjectTeleporterType | (string & {})): void {
    this.locked = false

    if (pos === "down" || pos === "left" || pos === "right" || pos === "up") {
      const dirPos = pos as keyof IGameObjectTeleporterType
      if (!this.itm.from) this.itm.from = {}
      if (!this.itm.from[dirPos]) this.itm.from[dirPos] = { x, y }
      this.itm.from[dirPos].x = x
      this.itm.from[dirPos].y = y
    } else if (pos === "position") {
      this.itm.x = x
      this.itm.y = y
    }

    this.writeData()
  }
  onDone(nextFunc: (s?: IGameObjectData, isDeleted?: boolean) => void): void {
    this.onSubmission = nextFunc
  }
  lock(newStatus: boolean = true): void {
    this.locked = newStatus
  }
  hide(newStatus: boolean = true): void {
    if (newStatus) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }
  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()

      if (this.locked) return
      this.locked = true

      const data: IGameObjectData = this.itm
      const formData = new FormData(this.el)

      for (const [keyRaw, valRaw] of formData) {
        const key = keyRaw.replace("tp-", "") as keyof IGameObjectData
        const val = valRaw.toString().trim()

        const posKeys = ["left", "down", "right", "up"]
        const posKey = posKeys.find((k) => key.includes(k)) as keyof IGameObjectTeleporterType
        if (posKey) {
          const fromKey = key.replace(`${posKey}-`, "") as keyof TeleporeterFromPosition
          if (!data.from) data.from = {}
          if (!data.from[posKey]) data.from[posKey] = { x: 0, y: 0 }
          if (fromKey === "x" || fromKey === "y") {
            data.from[posKey][fromKey] = Number(val)
          } else if (fromKey === "direction") {
            data.from[posKey][fromKey] = val as DirectionType
          }
        } else if (key === "x" || key === "y") {
          data[key] = Number(val)
        } else if (key === "name") {
          data[key] = val.length >= 1 ? val : data.id
        }
      }

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
        msg: "Are you sure want to unassign this teleporter?",
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
    this.writeDefault()
    this.writeData()
    this.findCoor()
    return this
  }
}
