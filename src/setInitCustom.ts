import fs from "fs"

const url = "./src/scripts/Code/InitialCustom"

interface ICustomMod {
  types?: string
  dtypes?: string
  typescript?: string
  javascript?: string
  scss?: string
  less?: string
  css?: string
}

const customMod: ICustomMod = {}

function parseFile(str: string): string {
  return str.replace(/ {2}/g, "\t")
}

function setInitCustom(): void {
  const typesFile = fs.readFileSync(`${url}/ModTypes.ts`, "utf-8")
  const dtypesFile = fs.readFileSync(`${url}/ModTypes.d.ts`, "utf-8")
  const tsFile = fs.readFileSync(`${url}/CustomScript.ts`, "utf-8")
  const jsFile = fs.readFileSync(`${url}/CustomScript.js`, "utf-8")
  const scssFile = fs.readFileSync(`${url}/CustomStyle.scss`, "utf-8")
  const lessFile = fs.readFileSync(`${url}/CustomStyle.less`, "utf-8")
  const cssFile = fs.readFileSync(`${url}/CustomStyle.css`, "utf-8")

  customMod.types = parseFile(typesFile)
  customMod.dtypes = parseFile(dtypesFile)
  customMod.typescript = parseFile(tsFile)
  customMod.javascript = parseFile(jsFile)
  customMod.scss = parseFile(scssFile)
  customMod.less = parseFile(lessFile)
  customMod.css = parseFile(cssFile)

  fs.writeFileSync("./src/scripts/Code/InitialCustom.json", JSON.stringify(customMod, null, 2), "utf-8")
}

setInitCustom()
