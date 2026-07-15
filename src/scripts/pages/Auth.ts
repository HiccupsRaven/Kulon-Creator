import modal from "../lib/modal"
import xhr from "../lib/xhr"
import { eroot, kel, qutor } from "../lib/kel"
import waittime from "../lib/waittime"
import LocalList from "../data/LocalList"
import localSave from "../manager/storage"
import { localeChanger } from "../lib/localeChanger"
import Preload from "./Preload"
import { checkScreenSize } from "../manager/screenSize"
import { IModalSelectConfig } from "../types/ModalTypes"

function SelectLang(): Partial<IModalSelectConfig> {
  return {
    ic: "language",
    msg: "Language",
    items: [
      { id: "id", label: "Bahasa Indonesia", activated: !LocalList.lang || LocalList.lang === "id" },
      { id: "en", label: "English", activated: LocalList.lang === "en" }
    ]
  }
}

export default class Auth {
  el: HTMLDivElement = kel("div", "Auth")

  async checkUser(): Promise<void> {
    const splash = qutor(".splash", this.el) || kel("div", "splash")
    splash.innerHTML = `<p><i class="fa-solid fa-circle-notch fa-spin"></i> Initializing ...</p>`
    this.el.append(splash)
    await waittime(1000)

    if (!LocalList.lang) {
      const newLang = await modal.select(SelectLang())

      const currLang = newLang === "en" || newLang === "id" ? newLang : "id"

      LocalList.lang = currLang
      localSave.save()
    }

    await localeChanger()

    const skins = await xhr.forceGet("/json/skins/skin_list.json?v=" + Date.now())
    const sounds = await xhr.forceGet("/json/audio/audio.json?v=" + Date.now())
    splash.classList.add("out")
    await waittime(1000)
    splash.remove()

    this.el.remove()

    await checkScreenSize()

    const preload = new Preload({ files: [...skins, ...sounds] })
    preload.init()
  }
  init(): void {
    eroot().append(this.el)
    this.checkUser()
  }
}
