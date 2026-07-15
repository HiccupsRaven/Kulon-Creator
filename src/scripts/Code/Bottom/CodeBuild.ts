import * as esbuild from "esbuild-wasm"
import * as sassModule from "sass"
import { CodeErrors } from "../data/CodeErrors"
import { db } from "../data/db"
import { idb } from "../../lib/idb"

const sass = sassModule

type Resolve = (val?: void) => void

export interface ICodeResult {
  code?: string
  lang?: string
  errors?: IAny
}

interface IBuildDetail {
  script: string
  scriptLoader: string
  style: string
  styleLoader: string
}

export class CodeBuild {
  private isInitialized: boolean = false

  private isBundling: boolean = false

  private bundleRemain: number = 0

  private scriptResult?: ICodeResult
  private styleResult?: ICodeResult

  private async renderResult(resolve: Resolve): Promise<void> {
    const err: string[] = []

    if (this.scriptResult?.errors) {
      err.push(`./customScript.${this.scriptResult.lang}\n${this.scriptResult.errors}`)
    }

    if (this.styleResult?.errors) {
      err.push(`./customStyle.${this.styleResult.lang}\n${this.styleResult.errors}`)
    }

    if (err.length >= 1) {
      await new Promise((resolver) => new CodeErrors(err, resolver))
      this.isBundling = false
      resolve()
      return
    }

    db.modLanguage.lastCompiled = Date.now()

    this.isBundling = false

    await this.saveCompiled()

    resolve()
  }

  private async saveCompiled(): Promise<void> {
    const scriptString = this.scriptResult!.code!
    const styleString = this.styleResult!.code!

    await idb.saveCompiled(db.id, scriptString, styleString)
  }

  private getDoneBundling(resolve: Resolve): void {
    this.bundleRemain--

    if (this.bundleRemain <= 0) {
      this.renderResult(resolve)
    }
  }

  async buildCode(config: IBuildDetail): Promise<void> {
    if (this.isBundling) return

    if (!this.isInitialized) {
      await this.initialize()
    }

    this.isBundling = true

    this.bundleRemain = 2

    return new Promise((resolve) => {
      this.buildScript(config.script, config.scriptLoader, resolve)
      this.buildStyle(config.style, config.styleLoader, resolve)
    })
  }

  async buildScript(fileString: string, fileLoader: string, resolve: Resolve): Promise<void> {
    try {
      const result = await esbuild.transform(fileString, {
        format: "esm",
        loader: fileLoader as esbuild.Loader
      })

      this.scriptResult = { ...result, lang: fileLoader }
    } catch (e) {
      const err = String(e)
      this.scriptResult = { errors: err, lang: fileLoader }
    } finally {
      this.getDoneBundling(resolve)
    }
  }

  async buildStyle(fileString: string, fileLoader: string, resolve: Resolve): Promise<void> {
    try {
      const sassCompiled = await sass.compileStringAsync(fileString, { style: "compressed" })
      const result = sassCompiled.css.toString()

      this.styleResult = { code: result, lang: fileLoader }
    } catch (e) {
      const err = String(e)
      this.styleResult = { errors: err, lang: fileLoader }
    } finally {
      this.getDoneBundling(resolve)
    }
  }

  private async initialize(): Promise<void> {
    await esbuild.initialize({
      wasmURL: "/bruhhh/esbuild.wasm"
    })
    this.isInitialized = true
  }
}
