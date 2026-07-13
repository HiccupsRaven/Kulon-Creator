import fs from "fs"
import { setInitCustom } from "./setInitCustom"

function copyVersion(): void {
  const packageString = fs.readFileSync("./package.json", "utf-8")
  const packageObject = JSON.parse(packageString)

  const versionObject = { package: packageObject.version }

  fs.writeFileSync("./src/scripts/APIs/version.json", JSON.stringify(versionObject), "utf-8")
}

async function copyWasm(): Promise<void> {
  const wasmFile = "./node_modules/esbuild-wasm/esbuild.wasm"
  const wasmExists = fs.existsSync(wasmFile)

  if (!wasmExists) {
    throw new Error(`File 'esbuild.wasm' does not exist.\nFix this by running 'npm install esbuild-wasm'.\nThen run 'npm run postinstall'\n`)
  }

  const bruhPath = "./public/bruhhh"
  if (!fs.existsSync(bruhPath)) fs.mkdirSync(bruhPath)

  fs.cpSync(wasmFile, `${bruhPath}/esbuild.wasm`)
}

async function startCopy() {
  copyVersion()
  await copyWasm()
  setInitCustom()
}
startCopy()
