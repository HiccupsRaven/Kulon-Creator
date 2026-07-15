import fs from "fs"
import colorTheme from "../ex/colorTheme.json"
import newTheme from "../ex/newTheme.json"
import * as monaco from "monaco-editor"

const myThemeColors: monaco.editor.IStandaloneThemeData["colors"] = {}
const myThemeRules: monaco.editor.IStandaloneThemeData["rules"] = []

const colorsVS = colorTheme.colors as monaco.editor.IStandaloneThemeData["colors"]
const colorsNew = newTheme.colors as monaco.editor.IStandaloneThemeData["colors"]

Object.keys(colorsNew).forEach((k) => {
  if (colorsVS[k]) {
    myThemeColors[k] = colorsVS[k]
  }
})

const rulesVSOld = colorTheme.tokenColors
const rulesVS: monaco.editor.IStandaloneThemeData["rules"] = []

rulesVSOld.forEach((itm) => {
  const scopes = typeof itm.scope === "string" ? [itm.scope] : itm.scope

  scopes.forEach((initialScopes) => {
    const arrScopes = initialScopes.split(",")

    arrScopes.forEach((k) => {
      rulesVS.push({
        token: k,
        background: itm.settings.background,
        foreground: itm.settings.foreground,
        fontStyle: itm.settings.fontStyle
      })
    })
  })
})

const rulesNew = newTheme.tokenColors as monaco.editor.IStandaloneThemeData["rules"]

const allRules: monaco.editor.IStandaloneThemeData["rules"] = [...rulesNew, ...rulesVS]

const definedTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  colors: {},
  rules: []
}

allRules.forEach((itm) => {
  const VSexistsArr = rulesVS.filter((k) => k.token === itm.token)
  const NewexistsArr = rulesNew.filter((k) => k.token === itm.token)

  const VSexists = VSexistsArr[VSexistsArr.length - 1]
  const Newexists = NewexistsArr[NewexistsArr.length - 1]

  const alreadyExists = myThemeRules.findIndex((k) => k.token === itm.token)

  if (alreadyExists !== -1) {
    myThemeRules.splice(alreadyExists, 1)
    console.log("dupes", itm.token)
  }

  if (VSexists && Newexists) {
    myThemeRules.push({
      token: itm.token,
      background: VSexists.background,
      foreground: VSexists.foreground,
      fontStyle: VSexists.fontStyle
    })
  } else if (Newexists) {
    if (Newexists.background || Newexists.foreground) {
      myThemeRules.push({
        token: itm.token,
        background: Newexists.background ? "#" + Newexists.background : undefined,
        foreground: Newexists.foreground ? "#" + Newexists.foreground : undefined
        // defBG: Newexists.background ? "000000" : undefined,
        // defFG: Newexists.foreground ? "000000" : undefined
      })
    }
  }
})

const colors = myThemeColors as monaco.editor.IStandaloneThemeData["colors"]
const rules = myThemeRules as monaco.editor.IStandaloneThemeData["rules"]

Object.keys(colors).forEach((k) => (definedTheme.colors[k] = colors[k]))

rules.forEach((itm) => {
  definedTheme.rules.push(itm)
})

fs.writeFileSync("./src/scripts/Code/Palenight.json", JSON.stringify(definedTheme), "utf-8")
