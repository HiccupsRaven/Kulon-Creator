import { eroot, futor, kel } from "../../lib/kel"
import { iform } from "../Editor/Forms/TemplateForm"
import { ICloudItem, IGameSettings, IMapList, IStartEnd } from "../types/CreatorTypes"
import { toText } from "./gen"
import { validateEvents, validateItems, validateMaps, validateSettings } from "./mapValidator"

type Resolve = (val: boolean) => void

interface ErrorFromAPI {
  path: string
  text: string
}

type ErrorsFromAPI = ErrorFromAPI[]

export class ValidateProject {
  private el!: HTMLFormElement

  constructor() {}

  private createElement(errors: string[]): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">BRUHHHHH???</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <br />
      <div class="f">
        <div class="i">
          <div class="tx center"><i class="fa-solid fa-face-raised-eyebrow fa-4x"></i></div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="tx center">Are you pretending not to see these problems?</div>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="validate-ol">
            <ol class="validate-list">
            </ol>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="s">
          <button class="btn btn-ok">*GASP~ AIGHT BRO :)</button>
        </div>
      </div>
    </div>`)

    const field = futor(".validate-list", this.el)

    const list = errors.map((k) => {
      const li = kel("li")
      li.innerHTML = k
      return li
    })

    field.append(...list)
  }

  async maps(data: IMapList): Promise<boolean> {
    const checked = validateMaps(data)
    if (checked.pass) return true

    return await this.init(checked.errors)
  }

  async project(mapData: IMapList, startend: IStartEnd, itemData: ICloudItem[], settingsData: IGameSettings, isTest?: boolean): Promise<boolean> {
    const errors: string[] = []

    const checkedMap = validateMaps(mapData)
    if (checkedMap.errors.length >= 1) errors.push(...checkedMap.errors)

    const startingSceneText = `Managements > Starting/Ending > Starting Events`

    const checkedStarting = validateEvents(startend.start || [], "undefined", startingSceneText)
    if (checkedStarting.errors.length >= 1) errors.push(...checkedStarting.errors)

    const endingSceneText = `Managements > Starting/Ending > Ending Events`

    const checkedEnding = validateEvents(startend.end || [], "undefined", endingSceneText)
    if (checkedEnding.errors.length >= 1) errors.push(...checkedEnding.errors)

    const checkedItems = validateItems(itemData)
    if (checkedItems.errors.length >= 1) errors.push(...checkedItems.errors)

    const checkSettings = validateSettings(settingsData, isTest)
    if (checkSettings.errors.length >= 1) errors.push(...checkSettings.errors)

    if (errors.length < 1) return true

    return await this.init(errors)
  }

  async fromAPI(errorsAPI: ErrorsFromAPI): Promise<boolean> {
    const errors: string[] = errorsAPI.map((k) => {
      return `${toText(k.text)}<br/><span class="mono">${k.path}</span>`
    })
    return await this.init(errors)
  }

  private submistListener(res: Resolve): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => this.destroy(res)

    this.el.onsubmit = (e) => {
      e.preventDefault()
      this.destroy(res)
    }
  }

  private destroy(res: Resolve): void {
    this.el.remove()
    res(false)
  }

  private async init(errors: string[]): Promise<boolean> {
    return await new Promise((res: Resolve) => {
      this.createElement(errors)
      eroot().append(this.el)
      this.submistListener(res)
    })
  }
}

export const validateProject = new ValidateProject()
