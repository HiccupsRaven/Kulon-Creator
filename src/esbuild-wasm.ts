import fs from "fs"

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

copyWasm()
