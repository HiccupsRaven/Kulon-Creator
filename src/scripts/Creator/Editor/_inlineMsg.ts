import { kel } from "../../lib/kel"

export function inlineEmpty(msg: string): HTMLDivElement {
  const el = kel("div", "card-empty")
  el.innerHTML = msg
  return el
}
