import { eroot, futor, kel } from "../../lib/kel"
import modal from "../../lib/modal"
import EVENT_LIST from "../data/eventList"
import { toText } from "../lib/gen"
import { UGCRef } from "../types/CreatorTypes"

function groupAndCountEvents(inputArray: string[]): string[] {
  const counts = inputArray.reduce((acc: Record<string, number>, currentString: string) => {
    acc[currentString] = (acc[currentString] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => `${value} (${count})`)
}

export class EditorDeleteProject {
  locked: boolean = false

  enabled: boolean = false

  private el!: HTMLDivElement
  private btnDelete!: HTMLButtonElement

  private onSubmission?: (s?: boolean) => void

  name: string

  constructor(public ugc: UGCRef) {
    this.name = ugc.settings.project
  }
  private createElement(): void {
    this.el = kel("div", "EditorDeleteProject")
    this.el.innerHTML = `
    <form class="box" action="/uwu/delete-project" method="post">
      <div class="box-top">Delete Project</div>
      <div class="box-mid">
        <div class="f delete-desc">
          <p>You will lose:</p>
        </div>
        <div class="f delete-lose">
          <ul class="work-list">
          </ul>
        </div>
        <div class="f delete-notice">
          <p>This action can't be undone</p>
        </div>
      </div>
      <div class="box-bottom">
        <div class="inp-text">
          <label for="project-delete">Type <b>${toText(this.name)}</b> to commit</label>
          <input type="text" name="project-delete" id="project-delete" placeholder="Type Here . . ." autocomplete="off" required />
        </div>
        <div class="inp-action">
          <div class="btn btn-project-cancel">CANCEL</div>
          <button class="btn btn-project-delete disabled">DELETE</button>
        </div>
      </div>
    </form>`
    this.btnDelete = futor(".btn-project-delete", this.el, "button")
  }

  private writeData(): void {
    const ul = futor(".work-list", this.el, "ul")

    const itemList: string[] = this.ugc.items.map((k) => k.name.en)

    const eItemListLi = kel("li")
    eItemListLi.innerHTML = `[${itemList.length}] Item`

    if (itemList.length >= 1) {
      const eItemUl = kel("ul")
      eItemListLi.append(eItemUl)

      const eItemLi = kel("li")
      eItemLi.innerText = itemList.join(", ")
      eItemUl.append(eItemLi)
    }

    const audioList: string[] = this.ugc.assets.filter((k) => k.type === "audio").map((k) => k.name)
    const imageList: string[] = this.ugc.assets.filter((k) => k.type !== "audio").map((k) => k.name)

    const assetList: number = audioList.length + imageList.length

    const eAssetListLi = kel("li")
    eAssetListLi.innerHTML = `[${assetList}] Asset`

    const eAudioListUl = kel("ul")
    eAssetListLi.append(eAudioListUl)

    const eAudioListLi = kel("li")
    eAudioListLi.innerHTML = `[${audioList.length}] Audio`
    eAudioListUl.append(eAudioListLi)

    if (audioList.length >= 1) {
      const eAudioUl = kel("ul")
      eAudioListLi.append(eAudioUl)

      const eAudioLi = kel("li")
      eAudioLi.innerText = audioList.join(", ")
      eAudioUl.append(eAudioLi)
    }

    const eImageListUl = kel("ul")
    eAssetListLi.append(eImageListUl)

    const eImageListLi = kel("li")
    eImageListLi.innerHTML = `[${imageList.length}] Image`
    eImageListUl.append(eImageListLi)

    if (imageList.length >= 1) {
      const eImageUl = kel("ul")
      eImageListLi.append(eImageUl)

      const eImageLi = kel("li")
      eImageLi.innerText = imageList.join(", ")
      eImageUl.append(eImageLi)
    }

    const mapList: string[] = []
    const personList: string[] = []
    const interactList: string[] = []
    const propList: string[] = []
    const teleportList: string[] = []

    let cutsceneList: number = 0
    const eventRawList: string[] = []
    let wallList: number = 0

    const maps = this.ugc.maps
    Object.values(maps).forEach((map) => {
      mapList.push(map.name)

      const objs = map.configObjects
      Object.values(objs).forEach((obj) => {
        if (obj.type === "Person") {
          personList.push(obj.name!)
        } else if (obj.type === "Interactable") {
          interactList.push(obj.name!)
        } else if (obj.type === "Prop") {
          propList.push(obj.name!)
        } else if (obj.type === "Teleporter") {
          teleportList.push(obj.name!)
        }

        obj.talk?.forEach((evts) => {
          evts.events.forEach((evt) => {
            eventRawList.push(EVENT_LIST.find((k) => k.id === evt.type)!.name)
          })
        })

        obj.drops?.forEach((evts) => {
          evts.events.forEach((evt) => {
            eventRawList.push(EVENT_LIST.find((k) => k.id === evt.type)!.name)
          })
        })
      })

      const cutscenes = map.cutscenes
      Object.values(cutscenes).forEach((cutscene) => {
        cutsceneList++

        cutscene.forEach((evts) => {
          evts.events.forEach((evt) => {
            eventRawList.push(EVENT_LIST.find((k) => k.id === evt.type)!.name)
          })
        })
      })

      const walls = map.walls
      Object.keys(walls).forEach(() => wallList++)
    })

    this.ugc.startend.start?.forEach((evt) => {
      eventRawList.push(EVENT_LIST.find((k) => k.id === evt.type)!.name)
    })
    this.ugc.startend.end?.forEach((evt) => {
      eventRawList.push(EVENT_LIST.find((k) => k.id === evt.type)!.name)
    })

    const eventList: string[] = groupAndCountEvents(eventRawList)

    const eMapListLi = kel("li")
    eMapListLi.innerHTML = `[${mapList.length}] Map`

    if (mapList.length >= 1) {
      const eMapUl = kel("ul")
      eMapListLi.append(eMapUl)

      const eMapLi = kel("li")
      eMapLi.innerText = mapList.join(", ")
      eMapUl.append(eMapLi)
    }

    const objectList = personList.length + interactList.length + propList.length + teleportList.length

    const eObjectListLi = kel("li")
    eObjectListLi.innerHTML = `[${objectList}] Object`

    const ePersonListUl = kel("ul")
    eObjectListLi.append(ePersonListUl)

    const ePersonListLi = kel("li")
    ePersonListLi.innerHTML = `[${personList.length}] Person/NPC`
    ePersonListUl.append(ePersonListLi)

    if (personList.length >= 1) {
      const ePersonUl = kel("ul")
      ePersonListLi.append(ePersonUl)

      const ePersonLi = kel("li")
      ePersonLi.innerText = personList.join(", ")
      ePersonUl.append(ePersonLi)
    }

    const eInteractListUl = kel("ul")
    eObjectListLi.append(eInteractListUl)

    const eInteractListLi = kel("li")
    eInteractListLi.innerHTML = `[${interactList.length}] Interactable`
    eInteractListUl.append(eInteractListLi)

    if (interactList.length >= 1) {
      const eInteractUl = kel("ul")
      eInteractListLi.append(eInteractUl)

      const eInteractLi = kel("li")
      eInteractLi.innerText = interactList.join(", ")
      eInteractUl.append(eInteractLi)
    }

    const ePropListUl = kel("ul")
    eObjectListLi.append(ePropListUl)

    const ePropListLi = kel("li")
    ePropListLi.innerHTML = `[${propList.length}] Prop`
    ePropListUl.append(ePropListLi)

    if (propList.length >= 1) {
      const ePropUl = kel("ul")
      ePropListLi.append(ePropUl)

      const ePropLi = kel("li")
      ePropLi.innerText = propList.join(", ")
      ePropUl.append(ePropLi)
    }

    const eTeleportListUl = kel("ul")
    eObjectListLi.append(eTeleportListUl)

    const eTeleportListLi = kel("li")
    eTeleportListLi.innerHTML = `[${teleportList.length}] Teleporter`
    eTeleportListUl.append(eTeleportListLi)

    if (teleportList.length >= 1) {
      const eTeleportUl = kel("ul")
      eTeleportListLi.append(eTeleportUl)

      const eTeleportLi = kel("li")
      eTeleportLi.innerText = teleportList.join(", ")
      eTeleportUl.append(eTeleportLi)
    }

    const eCutsceneList = kel("li")
    eCutsceneList.innerHTML = `[${cutsceneList}] Cutscene Space`

    const eEventListLi = kel("li")
    eEventListLi.innerHTML = `[${eventRawList.length}] Event`

    if (eventRawList.length >= 1) {
      const eEventUl = kel("ul")
      eEventListLi.append(eEventUl)

      const eEventLi = kel("li")
      eEventLi.innerText = eventList.join(", ")
      eEventUl.append(eEventLi)
    }

    const eWallListLi = kel("li")
    eWallListLi.innerHTML = `[${wallList}] Wall`

    ul.append(eItemListLi, eAssetListLi, eMapListLi, eObjectListLi, eCutsceneList, eEventListLi, eWallListLi)
  }
  private actionsListener(): void {
    const btnCancel = futor(".btn-project-cancel", this.el)
    btnCancel.onclick = () => {
      if (this.locked) return
      this.destroy()
    }

    const form = futor("form", this.el, "form")
    form.onsubmit = async (e) => {
      e.preventDefault()
      if (!this.enabled || this.locked) return
      this.locked = true

      const confDel = await modal.confirm({ msg: "This action can't be undone!<br/>Proceed?", okx: "DELETE NOW!", cancelx: "DO NOT DELETE!" })

      this.locked = false

      if (!confDel) return

      this.destroy(true)
    }
  }
  private inputListener(): void {
    const inp = futor("#project-delete", this.el, "input")
    inp.oninput = () => this.enable(inp.value.trim() === this.name)
  }
  private enable(status: boolean = true): void {
    this.enabled = status

    this.btnDelete.disabled = !status
    this.btnDelete.classList[status ? "remove" : "add"]("disabled")
  }
  onDone(newFunc?: (s?: boolean) => void): void {
    this.onSubmission = newFunc
  }
  destroy(s?: boolean): void {
    this.el.remove()

    if (this.onSubmission) {
      this.onSubmission(s)
      this.onSubmission = undefined
    }
  }
  init(): this {
    this.createElement()
    eroot().append(this.el)
    this.writeData()
    this.actionsListener()
    this.inputListener()
    return this
  }
}
