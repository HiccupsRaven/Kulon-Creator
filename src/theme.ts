import fs from "fs"
import colorTheme from "../ex/colorTheme.json"
import * as monaco from "monaco-editor"

const definedTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  colors: {},
  rules: []
}

const colors = colorTheme.colors as monaco.editor.IStandaloneThemeData["colors"]
const rules = colorTheme.tokenColors

Object.keys(colors).forEach((k) => (definedTheme.colors[k] = colors[k]))

rules.forEach((itm) => {
  const scopes = typeof itm.scope === "string" ? [itm.scope] : itm.scope

  const token = scopes.join(" ")

  definedTheme.rules.push({
    token: token,
    foreground: itm.settings.foreground,
    background: itm.settings.background,
    fontStyle: itm.settings.fontStyle
  })
})

fs.writeFileSync("./src/scripts/Code/Palenight.json", JSON.stringify(definedTheme), "utf-8")
