import * as monaco from "monaco-editor"
import palenightTheme from "../../Code/Palenight.json"
import initialCustom from "../InitialCustom.json"
import { IModLanguage, ModLanguage, ModScriptLanguage, ModStyleLanguage, UGMRef } from "../types/CodeTypes"
import { db } from "./db"

self.MonacoEnvironment = {
  getWorkerUrl: function (moduleId, label) {
    if (label === "json") {
      return "./fuhhh/json.worker.bundle.js"
    }
    if (label === "css" || label === "scss" || label === "less") {
      return "./fuhhh/css.worker.bundle.js"
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return "./fuhhh/html.worker.bundle.js"
    }
    if (label === "typescript" || label === "javascript") {
      return "./fuhhh/ts.worker.bundle.js"
    }
    return "./fuhhh/editor.worker.bundle.js"
  }
}

monaco.editor.defineTheme("Palenight", palenightTheme as monaco.editor.IStandaloneThemeData)

export const modLangExtensions: Record<ModLanguage, string> = {
  typescript: "ts",
  javascript: "js",
  scss: "scss",
  less: "less",
  css: "css",
  json: "json"
}

type ScriptIcon = Record<ModScriptLanguage, string>
type StyleIcon = Record<ModStyleLanguage, string>

export const scriptIcons: ScriptIcon = {
  typescript: "typescript",
  javascript: "js"
}

export const styleIcons: StyleIcon = {
  scss: "sass",
  less: "less",
  css: "css3"
}

export class EditorModel {
  private editor?: monaco.editor.IStandaloneCodeEditor

  private isLibAdded: boolean = false

  private isAutocompleteRegistered: boolean = false

  protected currentFile?: string

  private models: Record<string, monaco.editor.ITextModel | undefined> = {}

  findValues(modLang: IModLanguage): UGMRef {
    const scriptRawVal = initialCustom[modLang.script]
    const styleVal = initialCustom[modLang.style]

    const styleImportLine = `import "./CustomStyle.${modLangExtensions[modLang.style]}"`

    const scriptVal = scriptRawVal.replace("/*IMPORTSTYLE*/", styleImportLine)

    const filesValue: UGMRef = {
      script: scriptVal,
      style: styleVal
    }

    return filesValue
  }

  createModel(modFileName: string, modLang: ModLanguage, modVal: string): void {
    const fileName = `${modFileName}.${modLangExtensions[modLang]}`

    const fileUri = monaco.Uri.file("/" + fileName)

    const existingModel = this.models[modFileName]
    if (existingModel) {
      existingModel.dispose()
      this.models[modFileName] = undefined
      delete this.models[modFileName]
    }

    const model = monaco.editor.createModel(modVal, modLang, fileUri)

    this.models[modFileName] = model
  }

  startExternalLib(): void {
    if (this.isLibAdded) return
    this.isLibAdded = true

    monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false
    })

    monaco.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true,
      moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.typescript.ModuleKind.ESNext,
      baseUrl: "file:///"
    })

    monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false
    })

    monaco.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true,
      moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.typescript.ModuleKind.ESNext,
      baseUrl: "file:///"
    })

    const libSource = initialCustom.dtypes

    const libUri = "file:///mods.d.ts"

    monaco.typescript.typescriptDefaults.addExtraLib(libSource, libUri)

    this.createModel("ModTypes", "typescript", initialCustom.types)
    this.createModel("assets", "json", db.assets)
  }

  private registerFileAutocomplete(modLang: ModScriptLanguage): void {
    monaco.languages.registerCompletionItemProvider(modLang, {
      triggerCharacters: ["'", '"', ".", "/"],
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        })

        const isImporting = /from\s+['"](\.\/?[\w\-.]*)$/.test(textUntilPosition) || /import\s+['"](\.\/?[\w\-.]*)$/.test(textUntilPosition)

        if (!isImporting) {
          return { suggestions: [] }
        }

        const suggestions: monaco.languages.CompletionItem[] = []

        Object.values(this.models)
          .filter((model) => !model?.uri.path.includes(this.currentFile || "undefined"))
          .forEach((model) => {
            if (!model) return

            const path = model.uri.path

            const fullFileName = path.startsWith("/") ? path.substring(1) : path

            const isStyle = fullFileName.endsWith(".css") || fullFileName.endsWith(".scss") || fullFileName.endsWith(".less")

            let insertText = fullFileName
            if (!isStyle) {
              insertText = fullFileName.replace(/\.(ts|js)$/, "")
            }

            suggestions.push({
              label: fullFileName,
              kind: monaco.languages.CompletionItemKind.File,
              insertText: insertText,
              detail: isStyle ? "Style Module" : "Script Module"
            } as monaco.languages.CompletionItem)
          })

        return { suggestions }
      }
    })
  }

  switchModel(fileName: string): void {
    if (this.currentFile === fileName || !this.editor) return

    this.currentFile = fileName

    const model = this.models[fileName]

    if (!model) return

    this.editor.setModel(model)
    this.editor.updateOptions({ readOnly: fileName === "assets" })
  }

  init(field: HTMLDivElement): void {
    if (!this.isAutocompleteRegistered) {
      this.isAutocompleteRegistered = true
      this.registerFileAutocomplete("typescript")
      this.registerFileAutocomplete("javascript")
    }

    const model = this.models["CustomScript"]
    this.currentFile = "CustomScript"

    const editor = monaco.editor.create(field, {
      fontFamily: `"JetBrains Mono", "MonoLisa", monospace, monospace`,
      fontSize: 16,
      theme: "Palenight",
      automaticLayout: true,
      lineHeight: 2,
      cursorBlinking: "expand",
      cursorStyle: "block",
      minimap: { enabled: false },
      bracketPairColorization: { enabled: true },
      wordWrap: "on",
      renderWhitespace: "trailing",
      tabSize: 2,
      model: model ?? monaco.editor.createModel("", "typescript", monaco.Uri.file("/testFile.ts"))
    })

    this.editor = editor
  }
}

export const editorModel = new EditorModel()
