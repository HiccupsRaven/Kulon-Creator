import { kel } from "../lib/kel"

const OBJECTS_URL: string[] = []

let MOD_SCRIPT: string | undefined = undefined

export function setModScript(scriptString: string): void {
  MOD_SCRIPT = scriptString
}

export async function loadModScript(sourceCode: string): Promise<IAny> {
  const blob = new Blob([sourceCode], { type: "text/javascript" })

  const url = URL.createObjectURL(blob)

  const module = await import(/* webpackIgnore: true */ url)

  return module
}

export function getModScript(): string | undefined {
  return MOD_SCRIPT
}

export function loadModStyle(styleString: string): void {
  const styleLink = kel("style")
  styleLink.id = "game-mod-style"
  styleLink.textContent = styleString

  document.head.appendChild(styleLink)
}

export function unloadMod(): void {
  const styleRel = document.getElementById("game-mod-style")
  if (styleRel) styleRel.remove()

  OBJECTS_URL.forEach((str) => URL.revokeObjectURL(str))
}
