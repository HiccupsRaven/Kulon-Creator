import { iform } from "../../Creator/Editor/Forms/TemplateForm"
import { eroot, futor, kel } from "../../lib/kel"

export class CodeErrors {
  private el!: HTMLFormElement

  private onComplete: IAny

  constructor(err: string[], resolve: IAny) {
    this.onComplete = resolve

    this.createElement()
    this.createList(err)
    this.submistListener()
  }

  private createElement(): void {
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
  }

  private createList(err: string[]): void {
    const field = futor(".validate-list", this.el)

    const list = err.map((k) => {
      const li = kel("li")
      li.innerText = k
      return li
    })

    field.append(...list)

    eroot().append(this.el)
  }

  private submistListener(): void {
    const btnClose = futor(".btn-close", this.el)
    btnClose.onclick = () => this.destroy()

    this.el.onsubmit = (e) => {
      e.preventDefault()
      this.destroy()
    }
  }
  private destroy(): void {
    this.el.remove()
    this.onComplete()
  }
}
