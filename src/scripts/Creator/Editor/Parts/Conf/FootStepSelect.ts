import { eroot, futor } from "../../../../lib/kel"
import modal from "../../../../lib/modal"
import { IMapConfig } from "../../../types/CreatorTypes"
import { iform } from "../../Forms/TemplateForm"
import { ConfigMap } from "./ConfigMap"

export interface FootStepConfig {
  footstep: IMapConfig["footstep"]
  confMap: ConfigMap
}

export class FootStepSelect {
  locked: boolean = false
  private el!: HTMLFormElement

  private onSubmission?: (s?: IMapConfig["footstep"]) => void

  private footstep: IMapConfig["footstep"]

  confMap: ConfigMap

  constructor(config: FootStepConfig) {
    this.footstep = config.footstep
    this.confMap = config.confMap
  }

  private createElement(): void {
    this.el = iform(`
    <div class="box">
      <div class="f">
        <p class="title">Footstep Sound</p>
        <div class="btn btn-close"><i class="fa-duotone fa-light fa-circle-xmark"></i></div>
      </div>
      <div class="f">
        <div class="i">
          <p class="tx center">Play a variation of footstep sound</p>
        </div>
      </div>
      <div class="f">
        <div class="i">
          <div class="radio">
            <label for="footstep-a">
              <input type="radio" name="footstep" id="footstep-a" value="a" ${this.footstep === "a" || !this.footstep ? "checked " : ""}/>
              <span>In-door (stone alike)</span>
            </label>
          </div>
        </div>
        <div class="i">
          <div class="radio">
            <label for="footstep-b">
              <input type="radio" name="footstep" id="footstep-b" value="b" ${this.footstep === "b" ? "checked " : ""}/>
              <span>Out-door (dirt alike)</span>
            </label>
          </div>
        </div>
      </div>
      <div class="f">
        <div class="s">
          <button class="btn btn-ok">Ok</button>
        </div>
      </div>
    </div>`)
  }

  private submitListener(): void {
    this.el.onsubmit = async (e) => {
      e.preventDefault()
      if (this.locked) return
      this.locked = true

      const data: Record<string, string> = {}

      const formData = new FormData(this.el)

      for (const [key, val] of formData) {
        data[key] = val.toString()
      }

      if (!data["footstep"]) {
        await modal.alert("Data footstep is not found")
        this.locked = false
        return
      }

      this.locked = false

      const newFootStepSound = data["footstep"] as IMapConfig["footstep"]

      this.destroy(newFootStepSound)
    }
  }

  onDone(newFunc: (s?: IMapConfig["footstep"]) => void): void {
    this.onSubmission = newFunc
  }

  private closeListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => {
      if (this.locked) return
      this.destroy()
    }
  }

  destroy(footStepSound?: IMapConfig["footstep"]): void {
    this.el.remove()
    if (this.onSubmission) {
      this.onSubmission(footStepSound)
      this.onSubmission = undefined
    }
  }

  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.submitListener()
    this.closeListener()
    return this
  }
}
