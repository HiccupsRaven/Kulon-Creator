import * as monaco from "monaco-editor"
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

monaco.editor.create(document.getElementById("editor-monaco-container")!, {
  value: ["function x() {", '\tconsole.log("Hello world!");', "}"].join("\n"),
  language: "typescript"
})
