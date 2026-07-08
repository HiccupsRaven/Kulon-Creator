import * as monaco from "monaco-editor"
import palenightTheme from "../../Code/Palenight.json"
import * as initialCustom from "../InitialCustom.json"
import type { IModLanguage, ModScriptLanguage, ModStyleLanguage, UGMRef } from "../types/CodeTypes"

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

export function findModValues(modLang: IModLanguage): UGMRef {
  const scriptVal = initialCustom[modLang.script]
  const styleVal = initialCustom[modLang.style]

  const modValues: UGMRef = {
    script: scriptVal,
    style: styleVal
  }

  return modValues
}

let libAdded: boolean = false

export function addExternalLib(): void {
  if (libAdded) return
  libAdded = true

  monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false
  })

  monaco.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ES2015,
    allowNonTsExtensions: true
  })

  const libSource = initialCustom.types

  const libUri = "ts:filename/mods.d.ts"

  monaco.typescript.javascriptDefaults.addExtraLib(libSource, libUri)

  monaco.editor.createModel(libSource, "typescript", monaco.Uri.parse(libUri))
}

export function initEditor(field: HTMLDivElement, modLang: ModScriptLanguage | ModStyleLanguage, modVal: string): void {
  monaco.editor.create(field, {
    value: modVal,
    language: modLang,
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
    tabSize: 2
  })
}
