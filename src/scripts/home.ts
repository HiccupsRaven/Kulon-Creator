import "webfont-awesome-pro/scss/fontawesome.scss"
import "webfont-awesome-pro/scss/brands.scss"
import "webfont-awesome-pro/scss/pixel-regular.scss"
import "../styles/home.scss"

const paralax = document.querySelector(".para") as HTMLDivElement
const creatorSection = document.getElementById("creator") as HTMLDivElement

const btnContinue = document.querySelector(".btn-continue") as HTMLAnchorElement
const btnInstall = document.querySelector(".btn-install") as HTMLAnchorElement

const btnMenu = document.querySelector(".btn-menu") as HTMLDivElement
const nav = document.querySelector(".nav") as HTMLElement

function paralaxLookALike(): void {
  const scrollHeight = window.scrollY
  const paralaxTop = paralax.offsetTop

  const clientHeight = paralaxTop + paralax.offsetHeight
  const clientTop = paralaxTop - window.innerHeight
  const offset = scrollHeight - paralaxTop

  if (scrollHeight >= clientTop && scrollHeight < clientHeight) {
    paralax.style.backgroundPosition = `center calc(50% + ${offset * 0.6}px)`
  }
}

function setParalax(): void {
  paralaxLookALike()

  let ticking = false
  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        paralaxLookALike()
        ticking = false
      })
      ticking = true
    }
  })
}

function overWriteBtnScroll(): void {
  btnContinue.href = "#creator"

  btnContinue.onclick = (e) => {
    e.preventDefault()

    creatorSection.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" })
  }
}

let pwaInstaller: BeforeInstallPromptEvent | null = null
let PWA_READY: boolean = false

function setInstallToRedirect(): void {
  btnInstall.innerHTML = "TRY NOW"
  btnInstall.onclick = null
}

function setRedirectToInstall(): void {
  btnInstall.innerHTML = "INSTALL"
  btnInstall.onclick = async (e) => {
    e.preventDefault()
    if (window.matchMedia("(display-node: fullScreen)").matches) {
      window.location.href = "/creator.html"
      return
    }

    if (PWA_READY) {
      window.location.href = "/creator.html"
      return
    }

    if (pwaInstaller) {
      const confirm_install = await pwaInstaller.prompt()
      if (confirm_install.outcome === "accepted") {
        PWA_READY = true
      }
    }
  }
}

function setPWA(): void {
  window.addEventListener("appinstalled", () => setInstallToRedirect())

  window.addEventListener("beforeinstallprompt", (event: BeforeInstallPromptEvent) => {
    event.preventDefault()
    pwaInstaller = event

    if (window.matchMedia("(display-node: fullScreen)").matches) {
      PWA_READY = true
    }

    setRedirectToInstall()
  })
}

let isMenuOpen: boolean = false

function setMenu(): void {
  btnMenu.onclick = () => {
    isMenuOpen = !isMenuOpen

    if (isMenuOpen) {
      nav.classList.add("opened")
      btnMenu.innerHTML = `<i class="fa-pixel fa-regular fa-xmark fa-fw"></i>`
      return
    }
    nav.classList.remove("opened")
    btnMenu.innerHTML = `<i class="fa-pixel fa-regular fa-bars fa-fw"></i>`
  }
}

window.addEventListener("DOMContentLoaded", () => {
  setMenu()
  setParalax()
  overWriteBtnScroll()
  setPWA()
})
