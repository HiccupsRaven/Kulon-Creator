import "webfont-awesome-pro/scss/allstyles.scss"
import "../styles/code.scss"
import { vfs } from "./lib/VirtualFileSystem"
import { Editor } from "./Code/Editor"

async function startCodeEditor(): Promise<void> {
  await vfs.init()

  const editor = new Editor()

  editor.init()
}

window.onload = () => startCodeEditor()
