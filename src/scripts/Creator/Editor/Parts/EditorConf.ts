import { futor, kel } from "../../../lib/kel"
import { work } from "../../data/work"
import { EditorMiddle } from "../EditorMiddle"
import { ConfigMap } from "./Conf/ConfigMap"
import { ConfigWorld } from "./Conf/ConfigWorld"

interface EditorConfConfig {
  middle: EditorMiddle
}

export class EditorConf {
  locked: boolean = false
  private el!: HTMLDivElement
  middle!: EditorMiddle

  configMap!: ConfigMap
  configWorld!: ConfigWorld

  constructor(s: EditorConfConfig) {
    this.middle = s.middle
  }
  private createElement(): void {
    this.el = kel("div", "right")
    this.el.innerHTML = `
    <div class="box">
      <div class="box-conf conf-map">
        <div class="box-title">Configurations</div>
      </div>
      <div class="box-conf conf-world">
        <div class="box-title">Managements</div>
      </div>
    </div>`
  }
  private mapConfigListener(): void {
    const field = futor(".conf-map", this.el)
    this.configMap = new ConfigMap({ conf: this })
    this.configMap.init()
    field.append(this.configMap.html)
  }
  private managementsListener(): void {
    const field = futor(".conf-world", this.el)
    this.configWorld = new ConfigWorld({ conf: this })
    this.configWorld.init()
    field.append(this.configWorld.html)
  }

  linkMap(mapId?: string): void {
    const title = futor(".box-title", this.el)
    if (!mapId || !work[mapId]) {
      title.innerHTML = "Configurations"
      return
    }
    const map = work[mapId]

    title.innerText = map.name
  }

  get html(): HTMLDivElement {
    return this.el
  }
  init(): this {
    this.createElement()
    this.mapConfigListener()
    this.managementsListener()
    return this
  }
}
