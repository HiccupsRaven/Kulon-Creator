import * as monaco from "monaco-editor"
import palenightTheme from "./Code/Palenight.json"
import "webfont-awesome-pro/scss/allstyles.scss"
import "../styles/code.scss"

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

monaco.editor.create(document.getElementById("code-editor")!, {
  value: `export class EditorTop {\n\tlocked: boolean = false\n\tprivate el!: HTMLDivElement\n\teditor: Editor\n\n\tconstructor(s: EditorTopConfig) {\n\t\tthis.editor = s.editor\n\t}\n}\n\nfunction x(n: number): boolean {\n\tconsole.log("Hello world!");\n\treturn true;\n}`,
  language: "typescript",
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
