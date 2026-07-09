import * as monaco from "monaco-editor"
import palenightTheme from "../../Code/Palenight.json"
import initialCustom from "../InitialCustom.json"
import { IModLanguage, ModLanguage, ModScriptLanguage, UGMRef } from "../types/CodeTypes"

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

const modLangExtensions: Record<ModLanguage, string> = {
  typescript: "ts",
  javascript: "js",
  scss: "scss",
  less: "less",
  css: "css"
}

let libAdded: boolean = false

let isAutocompleteRegistered: boolean = false

let currentModFile: string = ""

const modModels: Record<string, monaco.editor.ITextModel | undefined> = {}

monaco.editor.defineTheme("Palenight", palenightTheme as monaco.editor.IStandaloneThemeData)

export function findModValues(modLang: IModLanguage): UGMRef {
  const scriptRawVal = initialCustom[modLang.script]
  const styleVal = initialCustom[modLang.style]

  const styleImportLine = `import "./CustomStyle.${modLangExtensions[modLang.style]}"`

  const scriptVal = scriptRawVal.replace("/*IMPORTSTYLE*/", styleImportLine)

  const modValues: UGMRef = {
    script: scriptVal,
    style: styleVal
  }

  return modValues
}

export function addExternalLib(): void {
  if (libAdded) return
  libAdded = true

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

  createFileModel("ModTypes", "typescript", initialCustom.types)
}

export function registerFileAutocomplete(modLang: ModScriptLanguage): void {
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

      Object.values(modModels)
        .filter((modModel) => !modModel?.uri.path.includes(currentModFile))
        .forEach((modModel) => {
          if (!modModel) return

          const path = modModel.uri.path

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

export function createFileModel(modFileName: string, modLang: ModLanguage, modVal: string): void {
  const fileName = `${modFileName}.${modLangExtensions[modLang]}`

  const fileUri = monaco.Uri.file("/" + fileName)

  const existingModel = modModels[modFileName]
  if (existingModel) {
    existingModel.dispose()
    modModels[modFileName] = undefined
    delete modModels[modFileName]
  }

  const model = monaco.editor.createModel(modVal, modLang, fileUri)

  modModels[modFileName] = model
}

export function initEditor(field: HTMLDivElement): void {
  if (!isAutocompleteRegistered) {
    isAutocompleteRegistered = true
    registerFileAutocomplete("typescript")
    registerFileAutocomplete("javascript")
  }

  const model = modModels["CustomScript"]
  currentModFile = "CustomScript"

  monaco.editor.create(field, {
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
}
