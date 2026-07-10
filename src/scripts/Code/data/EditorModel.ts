import * as monaco from "monaco-editor"
import KulonTheme from "../../Code/KulonTheme.json"
import initialCustom from "../InitialCustom.json"
import { IModLanguage, ModLanguage, ModScriptLanguage, ModStyleLanguage, UGMRef } from "../types/CodeTypes"
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

monaco.editor.defineTheme("KulonTheme", KulonTheme as monaco.editor.IStandaloneThemeData)

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

type ModelStateList = Record<string, monaco.editor.ICodeEditorViewState | null>

interface ISwitchLang {
  fileName: string
  language: ModLanguage
  value?: string
}

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
  private modelSaves: Record<string, number> = {}

  private focusTimeOut?: ReturnType<typeof setTimeout>

  private isModelWait: boolean = false
  private queueSwitchModel: string[] = []
  private queueModelInterval: ReturnType<typeof setInterval> | undefined

  private isLangWait: boolean = false
  private queueSwitchLang: ISwitchLang[] = []
  private queueLangInterval: ReturnType<typeof setInterval> | undefined

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

    this.editor?.getModel()

    const fileName = `${modFileName}.${modLangExtensions[modLang]}`

    const fileUri = monaco.Uri.file("/" + fileName)

    const model = monaco.editor.createModel(modVal, modLang, fileUri)

    model.onDidChangeContent((_e) => {
      if (model.isDisposed()) return

      const newVersion = model.getAlternativeVersionId()
      const oldVersion = this.modelSaves[modFileName]

      this.baseEditor?.middle.tabs?.setDirty(modFileName, oldVersion !== newVersion)
    })

    this.models[modFileName] = model

    this.modelSaves[modFileName] = model.getAlternativeVersionId()

    this.baseEditor?.middle.tabs?.setDirty(modFileName, false)
  }

  async saveModel(fileName: string): Promise<void> {
    if (fileName.includes("assets")) return

    const model = this.models[fileName]
    if (!model) return

    const actionExists = this.editor?.getAction("editor.action.formatDocument")
    if (actionExists) await actionExists.run()

    this.modelSaves[fileName] = model.getAlternativeVersionId()

    this.baseEditor?.middle.tabs?.setDirty(fileName, false)

    this.setFocus()

    const fileType = fileName === "CustomScript" ? "script" : "style"

    db[fileType] = model.getValue()

    if (fileType === "script") {
      db.modLanguage.script = model.getLanguageId() as ModScriptLanguage
    } else if (fileType === "style") {
      db.modLanguage.style = model.getLanguageId() as ModStyleLanguage
    }

    this.baseEditor?.bottom.uploadSave()
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

    const lastState = this.editor.saveViewState()

    this.modelStates[this.currentFile] = lastState
  }

  switchModel(fileName: string, isForced?: boolean): void {
    if ((this.currentFile === fileName && !isForced) || !this.editor) return

    this.queueSwitchModel.push(fileName)

    if (this.isModelWait) return

    this._runSwitchModel()
  }

  switchlLang(fileName: string, modLang: ModLanguage, modValue?: string): void {
    this.queueSwitchLang.push({ fileName, language: modLang, value: modValue })

    if (this.isLangWait) return

    this._runSwitchLang()
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

  private setFocus(n: number = 200): void {
    this.clearFocus()

    this.focusTimeOut = setTimeout(() => {
      this.editor?.focus()
      this.clearFocus()
    }, n)
  }

  private lockSwitchModel(): void {
    this.isModelWait = true
    setTimeout(() => (this.isModelWait = false), 300)
  }

  private lockSwitchLang(): void {
    this.isLangWait = true
    setTimeout(() => (this.isLangWait = false), 300)
  }

  get canSwitch(): boolean {
    return this.isModelWait
  }

  reset(modLang: IModLanguage, modVal: UGMRef): void {
    const modelScript = this.models["CustomScript"]

    const modelStyle = this.models["CustomStyle"]

    if (modelScript) this.switchlLang("CustomScript", modLang.script, modVal.script)
    if (modelStyle) this.switchlLang("CustomStyle", modLang.style, modVal.style)

    this.baseEditor?.middle.sysManager.restart()

    this.baseEditor?.middle.tabs?.setDirty("CustomScript", true)
    this.baseEditor?.middle.tabs?.setDirty("CustomStyle", true)
  }

  private setCommands(): void {
    if (!this.editor) return

    this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      this.saveModel(this.currentFile || "undefined")
    })

    this.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.PageDown, () => {
      const modelKeys = Object.keys(this.models)
      const modelSize = modelKeys.length

      const currentIdx = modelKeys.findIndex((k) => k === this.currentFile)
      const findIdx = currentIdx + 1

      const nextIdx = findIdx >= modelSize ? 0 : findIdx

      this.switchModel(modelKeys[nextIdx])
    })

    this.editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.PageUp, () => {
      const modelKeys = Object.keys(this.models)
      const modelSize = modelKeys.length

      const currentIdx = modelKeys.findIndex((k) => k === this.currentFile)
      const findIdx = currentIdx - 1

      const nextIdx = findIdx < 0 ? modelSize - 1 : findIdx

      this.switchModel(modelKeys[nextIdx])
    })
  }

  init(field: HTMLDivElement, baseEditor: Editor): void {
    if (!this.baseEditor) this.baseEditor = baseEditor

    if (!this.isAutocompleteRegistered) {
      this.isAutocompleteRegistered = true
      this.registerFileAutocomplete("typescript")
      this.registerFileAutocomplete("javascript")
    }

    this.currentFile = "CustomScript"

    const editor = monaco.editor.create(field, {
      fontFamily: `"JetBrains Mono", "MonoLisa", monospace, monospace`,
      fontSize: 16,
      disableMonospaceOptimizations: true,
      theme: "KulonTheme",
      automaticLayout: true,
      lineHeight: 2,
      cursorBlinking: "expand",
      cursorStyle: "block",
      minimap: { enabled: false },
      bracketPairColorization: { enabled: true },
      wordWrap: "on",
      renderWhitespace: "trailing",
      tabSize: 2
    })

    this.editor = editor

    this.setFocus(1000)

    this.switchModel("CustomScript", true)

    this.setCommands()

    this.listenToCursor()
  }

  private _renderSwitchModel(fileName: string): void {
    if (!this.editor) return

    this.queueSwitchModel.splice(0, 1)

    this.lockSwitchModel()

    this.saveState()

    this.currentFile = fileName

    this.baseEditor?.middle.tabs?.activate(fileName)

    const model = this.models[fileName]

    if (!model) return

    this.editor.setModel(model)

    this.editor.updateOptions({ readOnly: fileName === "assets" })

    const viewState = this.modelStates[fileName]

    if (viewState) this.editor.restoreViewState(viewState)

    if (this.baseEditor) this.baseEditor.bottom.updateLanguage(model.getLanguageId() as ModLanguage)

    this.setFocus()
  }

  private _runSwitchModel(): void {
    this._renderSwitchModel(this.queueSwitchModel[0])

    this.queueModelInterval = setInterval(() => {
      if (this.isModelWait) return

      const fileName = this.queueSwitchModel[0]

      if (fileName) return this._renderSwitchModel(fileName)

      clearInterval(this.queueModelInterval)
      this.queueModelInterval = undefined
    }, 100)
  }

  private _renderSwitchLang(config: ISwitchLang): void {
    if (!this.editor) return

    this.queueSwitchLang.splice(0, 1)

    this.lockSwitchLang()

    const model = this.models[config.fileName]
    if (!model) return

    const modVal = config.value ?? model.getValue()

    this.createModel(config.fileName, config.language, modVal)
    this.baseEditor?.middle.tabs?.changeTabLang(config.fileName, config.language)

    this.baseEditor?.middle.tabs?.setDirty(config.fileName, true)

    if (this.currentFile && this.currentFile === config.fileName) {
      this.switchModel(config.fileName, true)
    }
  }

  private _runSwitchLang(): void {
    this._renderSwitchLang(this.queueSwitchLang[0])

    this.queueLangInterval = setInterval(() => {
      if (this.isLangWait) return

      const fileConfig = this.queueSwitchLang[0]

      if (fileConfig) return this._renderSwitchLang(fileConfig)

      clearInterval(this.queueLangInterval)
      this.queueLangInterval = undefined
    }, 100)
  }
}

export const editorModel = new EditorModel()
