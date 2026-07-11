import * as esbuild from "esbuild-wasm"
import { CodeErrors } from "../data/CodeErrors"

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

    this.isBundling = false

    resolve()
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

      this.getDoneBundling(resolve)
    } catch (e) {
      const err = String(e)
      this.scriptResult = { errors: err, lang: fileLoader }
      this.getDoneBundling(resolve)
    }
  }

  async buildStyle(_fileString: string, _fileLoader: string, resolve: Resolve): Promise<void> {
    this.getDoneBundling(resolve)
  }

  private async initialize(): Promise<void> {
    await esbuild.initialize({
      wasmURL: "/bruhhh/esbuild.wasm"
    })
    this.isInitialized = true
  }
}
