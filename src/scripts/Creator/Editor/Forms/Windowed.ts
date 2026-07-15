import { kel } from "../../../lib/kel"
import { SSKelement } from "../../../types/LibTypes"

export function windowed(childs?: string | SSKelement): HTMLDivElement {
  const windowedId = Date.now().toString(36)
  const el = kel("div", `windowed windowed-${windowedId}`)
  if (typeof childs === "string") el.innerHTML = childs
  if (childs instanceof Node) el.append(childs)

  return el
}
