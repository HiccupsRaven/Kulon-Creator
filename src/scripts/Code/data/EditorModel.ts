import * as monaco from "monaco-editor"
import palenightTheme from "../../Code/Palenight.json"
import initialCustom from "../InitialCustom.json"
import { IModLanguage, ModLanguage, ModScriptLanguage, UGMRef } from "../types/CodeTypes"
import { db } from "./db"
import { Editor } from "../Editor"

self.MonacoEnvironment = {
  getWorkerUrl: function (_moduleId, label) {
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

type LangIcon = Record<ModLanguage, string>

type ModelList = Record<string, monaco.editor.ITextModel | undefined>

interface IModelState {
  position?: monaco.IPosition
  selection?: monaco.ISelection
}

type ModelStateList = Record<string, IModelState>

export const langIcons: LangIcon = {
  typescript: "typescript",
  javascript: "js",
  scss: "sass",
  less: "less",
  css: "css3",
  json: "brackets-curly"
}

export class EditorModel {
  private editor?: monaco.editor.IStandaloneCodeEditor

  private baseEditor?: Editor

  private isLibAdded: boolean = false

  private isAutocompleteRegistered: boolean = false

  protected currentFile?: string

  private models: ModelList = {}

  private modelStates: ModelStateList = {}

  private focusTimeOut?: ReturnType<typeof setTimeout>

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
    const existingModel = this.models[modFileName]
    if (existingModel) {
      existingModel.dispose()
      this.models[modFileName] = undefined
      delete this.models[modFileName]
    }

    const fileName = `${modFileName}.${modLangExtensions[modLang]}`

    const fileUri = monaco.Uri.file("/" + fileName)

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
    monaco.typescript.javascriptDefaults.addExtraLib(libSource, libUri)

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

        const filesToFilter: string[] = [this.currentFile || "undefined", "assets"]

        Object.values(this.models)
          .filter((model) => !filesToFilter.some((str) => model?.uri.path.includes(str)))
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

  private saveState(): void {
    if (!this.currentFile || !this.editor) return

    const lastState: IModelState = {
      position: this.editor.getPosition() ?? undefined,
      selection: this.editor.getSelection() ?? undefined
    }

    this.modelStates[this.currentFile] = lastState
  }

  switchModel(fileName: string): void {
    if (this.currentFile === fileName || !this.editor) return

    this.saveState()

    this.currentFile = fileName

    const model = this.models[fileName]

    if (!model) return

    this.editor.setModel(model)
    this.editor.updateOptions({ readOnly: fileName === "assets" })

    const lastPosition = this.modelStates[fileName]?.position
    if (lastPosition) {
      this.editor.setPosition(lastPosition)
      this.editor.revealPositionInCenter(lastPosition)
    }

    const lastSelection = this.modelStates[fileName]?.selection
    if (lastSelection) this.editor.setSelection(lastSelection)

    if (this.baseEditor) this.baseEditor.bottom.updateLanguage(model.getLanguageId() as ModLanguage)

    this.setFucus()
  }

  switchModelLang(fileName: string, modLang: ModLanguage): void {
    const model = this.models[fileName]
    if (!model) return

    const modVal = model.getValue()

    this.createModel(fileName, modLang, modVal)

    if (this.currentFile && this.currentFile === fileName) {
      this.currentFile = undefined
      this.switchModel(fileName)
    }
  }

  private listenToCursor(): void {
    if (!this.editor) return

    this.editor.onDidChangeCursorPosition((e) => {
      if (!this.editor || !this.baseEditor) return

      const { lineNumber, column } = e.position

      this.baseEditor.bottom.updatePosition(lineNumber, column)
    })

    this.editor.onDidChangeCursorSelection((e) => {
      if (!this.editor || !this.baseEditor) return

      const model = this.editor.getModel()
      if (!model) return

      const valueInRange = model.getValueInRange(e.selection)

      const valueLength = valueInRange.length

      this.baseEditor.bottom.updateSelection(valueLength)
    })
  }

  private clearFocus(): void {
    if (this.focusTimeOut) {
      clearTimeout(this.focusTimeOut)
      this.focusTimeOut = undefined
    }
  }

  private setFucus(n: number = 200): void {
    this.clearFocus()

    this.focusTimeOut = setTimeout(() => {
      this.editor?.focus()
      this.clearFocus()
    }, n)
  }

  reset(modLang: IModLanguage, modVal: UGMRef): void {
    const modelScript = this.models["CustomScript"]

    const modelStyle = this.models["CustomStyle"]

    if (modelScript) {
      modelScript.setValue(modVal.script!)
      this.switchModelLang("CustomScript", modLang.script)
    }

    if (modelStyle) {
      modelStyle.setValue(modVal.style!)
      this.switchModelLang("CustomStyle", modLang.style)
    }
  }

  init(field: HTMLDivElement, baseEditor: Editor): void {
    if (!this.baseEditor) this.baseEditor = baseEditor

    if (!this.isAutocompleteRegistered) {
      this.isAutocompleteRegistered = true
      this.registerFileAutocomplete("typescript")
      this.registerFileAutocomplete("javascript")
    }

    const model = this.models["CustomScript"] ?? monaco.editor.createModel("", "typescript", monaco.Uri.file("/testFile.ts"))

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
      model
    })

    this.editor = editor

    this.setFucus(1000)

    baseEditor.bottom.updateLanguage(model.getLanguageId() as ModLanguage)

    this.listenToCursor()
  }
}

export const editorModel = new EditorModel()
