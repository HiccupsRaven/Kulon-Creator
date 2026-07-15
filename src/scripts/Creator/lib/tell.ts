import audio from "../../lib/AudioHandler"
import { eroot, kel } from "../../lib/kel"

let currentTell: HTMLDivElement | undefined = undefined

let tellTimeout: ReturnType<typeof setTimeout> | undefined = undefined

function stopTell(): void {
  if (tellTimeout) {
    clearTimeout(tellTimeout)
    tellTimeout = undefined
  }

  if (!currentTell) return

  currentTell.remove()
  currentTell = undefined
}

export function doTell(text: string, icon?: string, weight?: string): void {
  stopTell()

  const el = kel("div", "tell")
  const icParent = kel("div", "ic")
  const ic = kel("i", `fa-${weight || "solid"} fa-${icon || "circle-check"} fa-fw`)
  icParent.append(ic)
  const msg = kel("div", "text")
  msg.innerHTML = text

  el.append(icParent, msg)

  eroot().appendChild(el)

  currentTell = el

  audio.emit({ action: "play", type: "ui", src: "goodnews01", options: { id: Date.now().toString(36) } })

  tellTimeout = setTimeout(() => stopTell(), 3000)
}
