import "webfont-awesome-pro/css/full.css"
import "../styles/game.scss"
import Auth from "./pages/Auth"
import localSave from "./manager/storage"
import Intro from "./pages/Intro"

window.onload = async () => {
  localSave.load()
  const intro = new Intro()
  await intro.init()
  new Auth().init()
}
