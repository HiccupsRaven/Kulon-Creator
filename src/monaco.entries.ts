const monacoEntries = {
  "editor.worker": { import: "monaco-editor/esm/vs/editor/editor.worker.js", filename: "[name].bundle.js" },
  "json.worker": { import: "monaco-editor/esm/vs/language/json/json.worker", filename: "[name].bundle.js" },
  "css.worker": { import: "monaco-editor/esm/vs/language/css/css.worker", filename: "[name].bundle.js" },
  "html.worker": { import: "monaco-editor/esm/vs/language/html/html.worker", filename: "[name].bundle.js" },
  "ts.worker": { import: "monaco-editor/esm/vs/language/typescript/ts.worker", filename: "[name].bundle.js" }
}

export default monacoEntries
