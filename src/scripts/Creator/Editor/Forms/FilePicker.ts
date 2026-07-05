import { eroot, futor, kel } from "../../../lib/kel"
import { IAssets } from "../../../types/LibTypes"
import { EditorFiles, EditorFilesConfig } from "../Parts/Sys/EditorFiles"
import { FileUpload } from "./FileUpload"
import { windowed } from "./Windowed"

export class FilePicker extends EditorFiles {
  locked: boolean = false
  private parent!: HTMLDivElement

  constructor(s: EditorFilesConfig) {
    super(s)
  }
  protected clickListener(): void {
    const btnNewFile = futor(".file-new .btn-new-file", this.parent)
    btnNewFile.onclick = () => {
      const fileUpload = new FileUpload()
      fileUpload.init()
      const onDone = this.onDone
      fileUpload.onDone((fileReturn?: IAssets) => {
        if (fileReturn && this.sys.field instanceof EditorFiles) {
          this.sys.field.addData(fileReturn)
        }
        const filePicker = new FilePicker({ sys: this.sys })
        filePicker.init()
        if (onDone) filePicker.onChosen(onDone)
      })
      this.onDone = undefined
      this.destroy()
    }
  }
  onFileClick(fileId: string): void {
    this.destroy(fileId)
  }
  onChosen(nextFunc: (s?: string) => void): void {
    this.onDone = nextFunc
  }
  get html(): HTMLDivElement {
    return this.el
  }
  destroy(fileId?: string): void {
    this.list = []
    this.parent.remove()
    if (this.onDone) {
      this.onDone(fileId)
      this.onDone = undefined
    }
  }
  private btnCloseListener(): void {
    const btnCancel = kel("div", "btn btn-cancel")
    btnCancel.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel'
    btnCancel.onclick = () => {
      if (this.locked) return
      this.destroy()
    }

    const btnField = futor(".file-new", this.el)
    btnField.prepend(btnCancel)
  }
  protected extended(): void {
    this.parent = windowed(this.el)
    eroot().append(this.parent)
    this.btnCloseListener()
  }
}
