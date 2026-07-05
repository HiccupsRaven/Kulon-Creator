import { eroot, futor, kel } from "../../../../lib/kel"
import { db } from "../../../data/db"
import { Editor } from "../../../Editor"
import { toObject } from "../../../lib/gen"
import { DirectionType, IGameSettings, IWorldSpawnRule } from "../../../types/CreatorTypes"
import { createSpawnFields, createSpawnRadio } from "./Settings/spawners"

type INavType = "general" | "players" | "spawn" | "pricing" | "gameplay" | "scripts" | (string & {})

let last_nav: INavType = "general"

interface IField {
  id: INavType[]
  html: HTMLDivElement
}

interface INav {
  id: INavType
  html: HTMLDivElement
}

interface ISpawnRadio {
  id: string
  html: HTMLDivElement
  input: HTMLInputElement
}

interface ISpawnField {
  id: string
  html: HTMLDivElement[]
}

export class GameSettings {
  locked: boolean = false

  private el!: HTMLDivElement
  private form!: HTMLFormElement

  list: IField[] = []
  navList: INav[] = []

  private spawnRadio: ISpawnRadio[] = []
  private spawnField: ISpawnField[] = []

  editor: Editor

  private settings: IGameSettings = { project: "noname" }

  private onSubmission?: (s?: IGameSettings) => void

  constructor(editor: Editor) {
    this.editor = editor
  }

  private createELement(): void {
    this.el = kel("div", "game-settings")
    this.el.innerHTML = `
    <div class="setting-box">
      <div class="setting-title">Game Settings</div>
      <div class="setting-content">
        <div class="setting-nav">
          <div class="btn card" x-nav="general">General</div>
          <div class="btn card" x-nav="players">Players</div>
          <div class="btn card" x-nav="spawn">Spawn</div>
          <div class="btn card" x-nav="pricing">Pricing & Payout</div>
          <div class="btn card" x-nav="gameplay">Gameplay</div>
          <div class="btn card" x-nav="scripts">Custom Scripts</div>
        </div>
        <div class="setting-form">
          <form action="/uwu" class="iform">
            <div class="box">
              <div class="group-setting-field">
                <div class="f f-st" x-field="general">
                  <div class="i">
                    <div class="inp">
                      <label for="st-project">*Project Name</label>
                      <input type="text" name="st-project" id="st-project" placeholder="My Project" autocomplete="off" required />
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="general">
                  <div class="i">
                    <div class="inp">
                      <label for="st-name">*Server Name <small>- separate language with \\ (id\\en) - visible to players</small></label>
                      <input type="text" name="st-name" id="st-name" placeholder="Game Guweh \\ My Game" autocomplete="off" />
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="general">
                  <div class="i">
                    <div class="inp">
                      <label for="st-desc">*Server Description <small>- separate language with \\ (id\\en) - visible to players</small></label>
                      <textarea type="text" name="st-desc" id="st-desc" placeholder="Rampok pusat judol \\ Rob the biggest casino" autocomplete="off"></textarea>
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="general">
                  <div class="i">
                    <div class="inp">
                      <p class="tx">*Server Type</p>
                      <div class="f p">
                        <div class="i">
                          <div class="radio">
                            <label for="st-type-1">
                              <input type="radio" name="st-type" id="st-type-1" value="1" />
                              <span>Mission</span>
                            </label>
                          </div>
                        </div>
                        <div class="i">
                          <div class="radio">
                            <label for="st-type-2">
                              <input type="radio" name="st-type" id="st-type-2" value="2" />
                              <span>Custom/Free Roam</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div class="info">
                        <ul>
                          <li>
                            <small>Mission: Players will be teleported back to The Kulon World after failing/completing the mission</small>
                          </li>
                          <li>
                            <small>Custom: You create the rules. Build a roleplay, contest, party, or anything else? No Problem!</small>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="general">
                  <div class="i">
                    <div class="inp">
                      <p class="tx">*Game Mode <small>- for server type: Mission</small></p>
                      <div class="f p">
                        <div class="i">
                          <div class="radio">
                            <label for="st-mode-1">
                              <input type="radio" name="st-mode" id="st-mode-1" value="1" />
                              <span>Co-op</span>
                            </label>
                          </div>
                        </div>
                        <div class="i">
                          <div class="radio">
                            <label for="st-mode-2">
                              <input type="radio" name="st-mode" id="st-mode-2" value="2" />
                              <span>Versus</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div class="f p">
                        <div class="i">
                          <div class="check">
                            <label for="st-allowCombat">
                              <input type="checkbox" name="st-allowCombat" id="st-allowCombat" value="true" />
                              <span>Allow PVP Combat</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="general">
                  <div class="i">
                    <div class="inp">
                      <p class="tx">*Server Ready</p>
                      <div class="f p">
                        <div class="i">
                          <div class="radio">
                            <label for="st-ready-1">
                              <input type="radio" name="st-ready" id="st-ready-1" value="1" />
                              <span>Release</span>
                            </label>
                          </div>
                        </div>
                        <div class="i">
                          <div class="radio">
                            <label for="st-ready-2">
                              <input type="radio" name="st-ready" id="st-ready-2" value="2" />
                              <span>Beta</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="players">
                  <div class="i">
                    <div class="inp">
                      <label for="st-min">*Min Player <small>( 1 - 12 )</small></label>
                      <input type="number" name="st-min" id="st-min" placeholder="1" autocomplete="off" min="1" max="12" />
                    </div>
                  </div>
                  <div class="i">
                    <div class="inp">
                      <label for="st-max">*Max Player <small>( 1 - 12 )</small></label>
                      <input type="number" name="st-max" id="st-max" placeholder="1" autocomplete="off" min="1" max="12" />
                    </div>
                  </div>
                </div>
                <div class="f f-st f-spawn-radio" x-field="spawn"></div>
                <div class="groups group-player-spawn f-st" x-field="spawn"></div>
                <div class="f f-st" x-field="pricing">
                  <div class="i">
                    <div class="inp">
                      <label for="st-price">*Entry Fee - Perisma <small>( 0 - 2048 )</small></label>
                      <div class="inp-ic">
                        <img src="/assets/items/cloud/perisma.png" alt="Perisma" />
                        <input type="number" name="st-price" id="st-price" placeholder="0" autocomplete="off" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="pricing">
                  <div class="i">
                    <div class="tx">*Payout <small>- for server type: Mission</small></div>
                    <div class="f p">
                      <div class="i">
                        <div class="inp">
                          <label for="st-payout-1">Hexsa <small>( 1 - 32 )</small></label>
                          <div class="inp-ic">
                            <img src="/assets/items/cloud/hexsa.png" alt="Hexsa" />
                            <input type="number" name="st-payout-1" id="st-payout-1" placeholder="1" autocomplete="off" min="1" max="32" />
                          </div>
                        </div>
                      </div>
                      <div class="i">
                        <div class="inp">
                          <label for="st-payout-2">Token <small>( 1 - 64 )</small></label>
                          <div class="inp-ic">
                            <img src="/assets/items/cloud/token.png" alt="Token" />
                            <input type="number" name="st-payout-2" id="st-payout-2" placeholder="2" autocomplete="off" min="1" max="64" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="info">
                      <ul>
                        <li>
                          <small>Co-op: all players will be receiving 100% of the payout, additional 2% for the host (102%).</small>
                        </li>
                        <li>
                          <small>Versus: the winners will be receiving 100% of the payout, and only 2% for anyone else.</small>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div class="f f-st" x-field="gameplay">
                  <div class="i">
                    <div class="inp">
                      <label for="st-reqs">*State Requirements <small>to complete the mission - for server type: Mission</small></label>
                      <textarea name="st-reqs" id="st-reqs" autocomplete="off" placeholder="RUBY_STOLEN, ISLAND_ESCAPED, BOAT_UNLOCKED"></textarea>
                    </div>
                  </div>
                </div>
                <div class="f f-st f-scripts" x-field="gameplay,scripts">
                  <div class="i">
                    <br /><br />
                    <div class="tx center"><b>Custom Scripts</b></div>
                    <div class="tx center">Open your Kulon's Project folder, then navigate to <span class="mono">MyProjects/${db.meta.id}/Mods</span>, and write your code!</div>
                    <br />
                    <div class="btn btn-find find-scripts">Preview Scripts</div>
                    <br /><br />
                  </div>
                </div>
              </div>
              <div class="group-setting-actions">
                <div class="f">
                  <div class="s">
                    <div class="btn btn-close">Cancel</div>
                  </div>
                  <div class="s">
                    <button class="btn btn-ok">Apply</button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>`

    this.form = futor(".iform", this.el, "form")
  }

  private updateData(): void {
    const inpProject = futor("#st-project", this.el, "input")
    inpProject.value = this.settings.project

    const inpName = futor("#st-name", this.el, "input")
    const sName = this.settings.name
    inpName.value = sName?.id ? `${sName.id} \\ ${sName.en}` : ""

    const inpDesc = futor("#st-desc", this.el, "textarea")
    const sDesc = this.settings.desc
    inpDesc.value = sDesc?.id ? `${sDesc.id} \\ ${sDesc.en}` : ""

    const inpType = futor(`#st-type-${this.settings.type ?? 1}`, this.el, "input")
    if (inpType) inpType.checked = true

    const inpMode = futor(`#st-mode-${this.settings.mode ?? 1}`, this.el, "input")
    if (inpMode) inpMode.checked = true

    const inpCombat = futor("#st-allowCombat", this.el, "input")
    if (this.settings.allowCombat) inpCombat.checked = true

    const inpReady = futor(`#st-ready-${this.settings.ready ?? 2}`, this.el, "input")
    if (inpReady) inpReady.checked = true

    const inpMin = futor("#st-min", this.el, "input")
    inpMin.value = this.settings.min?.toString() || "1"

    const inpMax = futor("#st-max", this.el, "input")
    inpMax.value = this.settings.max?.toString() || "4"

    const inpPrice = futor("#st-price", this.el, "input")
    inpPrice.value = this.settings.price?.toString() || "0"

    const inpHexsa = futor("#st-payout-1", this.el, "input")
    inpHexsa.value = this.settings.payout?.[0]?.toString() || "1"

    const inpToken = futor("#st-payout-2", this.el, "input")
    inpToken.value = this.settings.payout?.[1]?.toString() || "2"

    const inpReqs = futor("#st-reqs", this.el, "textarea")
    inpReqs.value = this.settings.reqs?.join(", ") || ""

    this.updateRadioSpawn()
    this.updateFieldSpawn()
    this.onRadioSpawnChange("1")

    inpMax.onchange = () => this.onMaxPlayerChange(inpMax)
  }

  private onMaxPlayerChange(inp?: HTMLInputElement): void {
    const parsedSpawner = this.parseSpawners()
    this.settings.spawn = toObject(parsedSpawner)

    const inpMax = inp ?? futor("#st-max", this.el, "input")

    const rawMax = Number(inpMax.value || "4")
    const invalidMax = rawMax < 1 || rawMax > 12 || isNaN(rawMax)
    const max = invalidMax ? 4 : rawMax
    inpMax.value = max.toString()

    this.updateRadioSpawn()
    this.updateFieldSpawn()
    this.onRadioSpawnChange("1")
  }

  private parseSpawners(): IWorldSpawnRule[] {
    const spawners: IWorldSpawnRule[] = toObject(this.settings.spawn || [])

    const formData = new FormData(this.form)

    formData.forEach((rawVal, key) => {
      if (!key.includes("st-spawn-")) return
      if (key.includes("placeholder")) return
      const id = key.replace(/st-spawn-map-|st-spawn-x-|st-spawn-y-|st-spawn-direction-/, "")
      const keyId = Number(id)
      const keyIdx = keyId - 1
      const val = rawVal.toString().trim()
      const valMin = val.length < 1

      if (!spawners[keyIdx]) spawners[keyIdx] = {}

      if (key.includes("map")) {
        spawners[keyIdx].map = valMin ? undefined : val
      } else if (key.includes("x")) {
        spawners[keyIdx].x = valMin ? undefined : Number(val)
      } else if (key.includes("y")) {
        spawners[keyIdx].y = valMin ? undefined : Number(val)
      } else if (key.includes("direction")) {
        spawners[keyIdx].direction = val.toString() as DirectionType
      }
    })

    return spawners
  }

  private updateRadioSpawn(): void {
    this.spawnRadio.forEach((k) => {
      k.input.onchange = null
      k.html.remove()
    })

    this.spawnRadio.splice(0, this.spawnRadio.length)

    const inpMax = futor("#st-max", this.el, "input")
    const rawMax = Number(inpMax.value || "4")
    const invalidMax = rawMax < 1 || rawMax > 12 || isNaN(rawMax)
    const max = invalidMax ? 4 : rawMax

    const groupRadio = futor(".f-spawn-radio", this.el)

    for (let i = 0; i < max; i++) {
      const id = (i + 1).toString()
      const radio = createSpawnRadio(id)

      groupRadio.append(radio.html)

      if (i === 0) radio.input.checked = true

      radio.input.onchange = () => this.onRadioSpawnChange(id)

      this.spawnRadio.push({ id, html: radio.html, input: radio.input })
    }
  }

  private onRadioSpawnChange(id: string): void {
    this.spawnField.forEach((k) => {
      k.html.forEach((field) => field.classList[k.id === id ? "remove" : "add"]("hide"))
    })
  }

  private updateFieldSpawn(): void {
    this.spawnField.forEach((k) => {
      k.html.forEach((k) => k.remove())
    })
    this.spawnField.splice(0, this.spawnField.length)

    const inpMax = futor("#st-max", this.el, "input")
    const rawMax = Number(inpMax.value || "4")
    const invalidMax = rawMax < 1 || rawMax > 12 || isNaN(rawMax)
    const max = invalidMax ? 4 : rawMax

    const groupField = futor(".group-player-spawn", this.el)

    for (let i = 0; i < max; i++) {
      const id = (i + 1).toString()

      const field = createSpawnFields(id, this, this.settings.spawn?.[i])

      groupField.append(...field)

      this.spawnField.push({ id, html: field })
    }
  }

  private writeField(): void {
    this.settings = toObject(db.settings)

    const fields = this.el.querySelectorAll(".iform .f-st") as NodeListOf<HTMLDivElement>
    fields.forEach((field) => {
      const ids = field.getAttribute("x-field")?.toString() || "none"
      const id = ids.split(",").map((k) => k.trim())

      this.list.push({ id, html: field })
    })

    this.activateNav(last_nav)
    this.sortField()
  }

  private sortField(): void {
    this.list.forEach((field) => {
      field.html.classList[field.id.includes(last_nav) ? "remove" : "add"]("hide")
    })
  }

  private navListener(): void {
    const navs = this.el.querySelectorAll(".setting-nav .card") as NodeListOf<HTMLDivElement>
    navs.forEach((nav) => {
      const id = nav.getAttribute("x-nav")?.toString() || "none"

      this.navList.push({ id, html: nav })

      nav.onclick = () => {
        if (this.locked) return
        this.onNavClick(id)
      }
    })
  }

  private onNavClick(id: INavType): void {
    this.setLast(id)
    this.activateNav(id)
    this.sortField()
  }

  private activateNav(id: INavType): void {
    this.navList.forEach((nav) => {
      nav.html.classList[nav.id === id ? "add" : "remove"]("active")
    })
  }

  private setLast(id: INavType): void {
    last_nav = id
  }

  private submitListener(): void {
    this.form.onsubmit = (e) => {
      e.preventDefault()
      if (this.locked) return
      this.lock()

      const formData = new FormData(this.form)

      const data: IGameSettings = toObject(this.settings)

      const payoutList: [number, number] = [1, 2]

      for (const [rawKey, rawVal] of formData) {
        const val = rawVal.toString().trim()

        const key = rawKey.replace("st-", "")

        if (key === "project") {
          data.project = val.length < 1 ? this.settings.project : val
        } else if (key === "name" || key === "desc") {
          const valArr = val?.split("\\")

          const valId = valArr?.[0]?.trim() || val

          const valEn = valArr?.[1]?.trim() || valId

          data[key] = { id: valId, en: valEn }
        } else if (key === "type") {
          const numVal = Number(val)

          const invalidVal = numVal > 2 || numVal < 1

          data.type = invalidVal ? 1 : numVal
        } else if (key === "mode") {
          const numVal = Number(val)

          const invalidVal = numVal > 2 || numVal < 1

          data.mode = invalidVal ? 1 : numVal
        } else if (key === "allowCombat") {
          data.allowCombat = val === "true"
        } else if (key === "ready") {
          const validVal = Number(val)

          data.ready = validVal > 2 || validVal < 1 ? 2 : validVal
        } else if (key === "min") {
          const numVal = Number(val)

          const invalidVal = numVal < 1 || numVal > 12

          data.min = invalidVal ? 1 : numVal
        } else if (key === "max") {
          const numVal = Number(val)

          const invalidVal = numVal < 1 || numVal > 12

          data.max = invalidVal ? 4 : numVal
        } else if (key === "price") {
          const numVal = Number(val)

          const invalidVal = numVal < 0 || numVal > 2048

          data.price = invalidVal ? 0 : numVal
        } else if (key.includes("payout")) {
          const idxRaw = key.replace("payout-", "")
          const idx = Number(idxRaw) - 1

          if (idx === 0) {
            const numVal = Number(val)

            const invalidVal = numVal < 1 || numVal > 32

            payoutList[0] = invalidVal ? 1 : numVal
          } else {
            const numVal = Number(val)

            const invalidVal = numVal < 1 || numVal > 64

            payoutList[1] = invalidVal ? 2 : numVal
          }
        } else if (key === "reqs") {
          data.reqs = val.split(",").map((state) => state.trim())
        }
      }

      data.payout = payoutList

      if ((data.min || 1) > (data.max || 4)) {
        data.min = data.max
      }

      const spawners = this.parseSpawners()

      if (!data.spawn) data.spawn = []

      for (let i = 0; i < (data.max || 4); i++) {
        data.spawn[i] = spawners[i] || {}
      }

      data.spawn.splice((data.max || 4) - 1, data.spawn.length - (data.max || 4))

      if ((data.name?.id.length || 0) < 1 || (data.name?.en.length || 0) < 1) {
        delete data.name
      }

      if ((data.desc?.id.length || 0) < 1 || (data.desc?.en.length || 0) < 1) {
        delete data.desc
      }

      const filteredReqs = data.reqs?.filter((state) => state.length >= 1) || []
      data.reqs = filteredReqs
      if (filteredReqs.length < 1) {
        delete data.reqs
      }

      this.lock(false)

      this.destroy(data)
    }
  }

  onDone(newFunc?: (s?: IGameSettings) => void): void {
    this.onSubmission = newFunc
  }
  private closeListener(): void {
    const btnClose = futor(".group-setting-actions .btn-close")
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }

  hide(status: boolean = true): void {
    if (status) {
      this.el.classList.add("hide")
      return
    }
    this.el.classList.remove("hide")
  }

  lock(status: boolean = true): void {
    this.locked = status
  }

  destroy(updatedSettings?: IGameSettings): void {
    if (this.locked) return
    this.el.remove()
    if (this.onSubmission) {
      this.onSubmission(updatedSettings)
      this.onSubmission = undefined
    }
  }
  init(): this {
    this.createELement()
    eroot().append(this.el)
    this.navListener()
    this.writeField()
    this.updateData()
    this.submitListener()
    this.closeListener()
    return this
  }
}
