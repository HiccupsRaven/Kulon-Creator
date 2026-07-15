import { kel } from "../../lib/kel"
import { IAny } from "../../types/LibTypes"

export function genStringId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

export function rStr(): string {
  return Date.now().toString(36)
}

export function toText(rawText: string): string {
  const div = kel("div")
  div.innerText = rawText

  const newText = div.innerHTML.toString()
  div.remove()

  return newText
}

export function toObject(rawObject: IAny): IAny {
  const newObject = JSON.parse(JSON.stringify(rawObject))
  return newObject
}

export function sanitizeName(filename: string): string {
  const noExtension = filename.replace(/\.[^/.]+$|[^a-z0-9_-]/gi, "")
  return noExtension
}
